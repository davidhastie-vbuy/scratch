const fs = require('fs');
const path = require('path');

const CSV_FILES = [
  'C:\\Users\\indep\\Downloads\\export1.csv',
  'C:\\Users\\indep\\Downloads\\export2.csv',
  'C:\\Users\\indep\\Downloads\\export3.csv',
];

const TABLE_MAP = {
  auth_users: 'auth.users',
  auth_identities: 'auth.identities',
  profiles: 'public.profiles',
  user_roles: 'public.user_roles',
  provider_profiles: 'public.provider_profiles',
  provider_documents: 'public.provider_documents',
  jobs: 'public.jobs',
  quotes: 'public.quotes',
  job_invitations: 'public.job_invitations',
  job_milestones: 'public.job_milestones',
  conversations: 'public.conversations',
  messages: 'public.messages',
  escrow_payments: 'public.escrow_payments',
  notifications: 'public.notifications',
  reviews: 'public.reviews',
  provider_transactions: 'public.provider_transactions',
  support_tickets: 'public.support_tickets',
};

// Insertion order respecting FK constraints
const INSERT_ORDER = [
  'auth.users', 'auth.identities', 'public.profiles', 'public.user_roles',
  'public.provider_profiles', 'public.provider_documents', 'public.jobs',
  'public.quotes', 'public.job_invitations', 'public.conversations',
  'public.messages', 'public.job_milestones', 'public.escrow_payments',
  'public.notifications', 'public.reviews', 'public.provider_transactions',
  'public.support_tickets',
];

// Columns known to be jsonb
const JSONB_COLS = new Set([
  'raw_app_meta_data', 'raw_user_meta_data', 'identity_data', 'metadata',
]);

// Columns to skip (generated or deprecated in newer Supabase)
const SKIP_COLS = {
  'auth.users': new Set(['confirmed_at', 'is_super_admin']),
  'auth.identities': new Set(['email']),
  'public.reviews': new Set(['overall_rating']),
};

function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function formatValue(key, val) {
  if (val === null || val === undefined) return 'NULL';
  if (JSONB_COLS.has(key)) {
    return escapeSQL(JSON.stringify(val)) + '::jsonb';
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'";
    // Check if numeric array
    const allNums = val.every(v => typeof v === 'number');
    if (allNums) {
      return "ARRAY[" + val.join(',') + "]";
    }
    return "ARRAY[" + val.map(v => escapeSQL(String(v))).join(',') + "]";
  }
  if (typeof val === 'object') {
    return escapeSQL(JSON.stringify(val)) + '::jsonb';
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  return escapeSQL(val);
}

function parseCsvRow(line) {
  // Format: "json_data";table_name
  // The JSON data is wrapped in outer quotes with internal "" escaping
  // Find the last semicolon that separates data from tbl
  const lastSemiIdx = line.lastIndexOf(';');
  if (lastSemiIdx === -1) return null;
  
  let dataStr = line.substring(0, lastSemiIdx);
  const tbl = line.substring(lastSemiIdx + 1).trim();
  
  // Strip outer quotes
  if (dataStr.startsWith('"') && dataStr.endsWith('"')) {
    dataStr = dataStr.substring(1, dataStr.length - 1);
  }
  
  // Unescape doubled quotes
  dataStr = dataStr.replace(/""/g, '"');
  
  try {
    const data = JSON.parse(dataStr);
    return { tbl, data };
  } catch (e) {
    console.error(`Failed to parse JSON for table ${tbl}: ${e.message}`);
    console.error(`First 200 chars: ${dataStr.substring(0, 200)}`);
    return null;
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const rows = [];
  
  let currentLine = '';
  let inQuotedField = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header
    if (i === 0 && (line.startsWith('data;tbl') || line.startsWith('tbl;data'))) continue;
    if (line.trim() === '') continue;
    
    currentLine += (currentLine ? '\n' : '') + line;
    
    // Count unescaped quotes to determine if we're in a multi-line field
    // A row is complete when the quoted field is properly closed
    const quoteCount = (currentLine.match(/"/g) || []).length;
    
    // Simple heuristic: row ends with ";table_name" where table_name has no quotes
    const lastSemi = currentLine.lastIndexOf(';');
    if (lastSemi > 0) {
      const afterSemi = currentLine.substring(lastSemi + 1).trim();
      if (TABLE_MAP[afterSemi] || afterSemi === 'auth_users' || afterSemi === 'auth_identities') {
        const parsed = parseCsvRow(currentLine);
        if (parsed) rows.push(parsed);
        currentLine = '';
      }
    }
  }
  
  return rows;
}

// Main
const allRows = {};
INSERT_ORDER.forEach(t => allRows[t] = []);

for (const file of CSV_FILES) {
  console.log(`Processing ${path.basename(file)}...`);
  const rows = processFile(file);
  console.log(`  Parsed ${rows.length} rows`);
  
  for (const row of rows) {
    const sqlTable = TABLE_MAP[row.tbl];
    if (!sqlTable) {
      console.warn(`  Unknown table: ${row.tbl}`);
      continue;
    }
    if (!allRows[sqlTable]) allRows[sqlTable] = [];
    allRows[sqlTable].push(row.data);
  }
}

// Generate SQL
let sql = '-- Data migration from old BookATrade Supabase project\n';
sql += '-- Generated: ' + new Date().toISOString() + '\n\n';
sql += 'BEGIN;\n\n';
sql += "-- Disable triggers to avoid email side effects during import\n";
sql += "SET session_replication_role = 'replica';\n\n";

let totalInserts = 0;

for (const table of INSERT_ORDER) {
  const rows = allRows[table] || [];
  if (rows.length === 0) {
    sql += `-- ${table}: 0 rows (skipped)\n\n`;
    continue;
  }
  
  sql += `-- ${table}: ${rows.length} rows\n`;
  console.log(`${table}: ${rows.length} rows`);
  
  for (const row of rows) {
    const skipSet = SKIP_COLS[table] || new Set();
    const cols = Object.keys(row).filter(c => !skipSet.has(c));
    const vals = cols.map(c => formatValue(c, row[c]));
    
    sql += `INSERT INTO ${table} (${cols.map(c => '"' + c + '"').join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
    totalInserts++;
  }
  sql += '\n';
}

sql += "-- Re-enable triggers\n";
sql += "SET session_replication_role = 'origin';\n\n";
sql += 'COMMIT;\n';

const outPath = path.join(__dirname, 'migration-data.sql');
fs.writeFileSync(outPath, sql, 'utf-8');
console.log(`\nGenerated ${totalInserts} INSERT statements -> ${outPath}`);
console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
