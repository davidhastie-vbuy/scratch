import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authentication is OPTIONAL during signup (user has no session yet)
    // We validate ownership via user_id + provider_profile existence instead
    const authHeader = req.headers.get("Authorization");
    let authenticatedUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        authenticatedUserId = user.id;
      }
    }

    const formData = await req.formData();
    const userId = formData.get("user_id") as string;

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If authenticated, ensure the token matches the user_id
    if (authenticatedUserId && authenticatedUserId !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user actually exists in auth (prevents arbitrary uploads)
    const { data: { user: targetUser }, error: userCheckErr } = await supabase.auth.admin.getUserById(userId);
    if (userCheckErr || !targetUser) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the provider profile created by the trigger (with retry for race condition)
    let profile: { id: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error: profileErr } = await supabase
        .from("provider_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (data) {
        profile = data;
        break;
      }
      console.log(`Profile not found yet, attempt ${attempt + 1}/5, waiting...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!profile) {
      console.error("Provider profile not found after 5 attempts for user:", userId);
      return new Response(
        JSON.stringify({ error: "Provider profile not found. Please try again shortly." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const files = formData.getAll("documents") as File[];
    const uploaded: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        console.error("File too large:", file.name, file.size);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        console.error("Invalid file type:", file.name, file.type);
        continue;
      }

      const storagePath = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("provider-documents")
        .upload(storagePath, file);

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        continue;
      }

      const { error: insertErr } = await supabase.from("provider_documents").insert({
        provider_profile_id: profile.id,
        user_id: userId,
        file_url: storagePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      if (insertErr) {
        console.error("Document record insert error:", insertErr);
        continue;
      }

      uploaded.push(file.name);
    }

    return new Response(
      JSON.stringify({ success: true, uploaded_count: uploaded.length, files: uploaded }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
