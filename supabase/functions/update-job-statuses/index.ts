import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  // Move accepted → in_progress when scheduled_start has passed
  const { data: startedJobs, error: startErr } = await supabase
    .from("jobs")
    .update({ status: "in_progress" })
    .eq("status", "accepted")
    .lte("scheduled_start", now)
    .select("id");

  // Move in_progress → completed when scheduled_end has passed
  const { data: completedJobs, error: endErr } = await supabase
    .from("jobs")
    .update({ status: "completed" })
    .eq("status", "in_progress")
    .lte("scheduled_end", now)
    .select("id");

  console.log("Status update run:", {
    started: startedJobs?.length ?? 0,
    completed: completedJobs?.length ?? 0,
    errors: { startErr, endErr },
  });

  return new Response(JSON.stringify({
    started: startedJobs?.length ?? 0,
    completed: completedJobs?.length ?? 0,
  }), { headers: { "Content-Type": "application/json" } });
});
