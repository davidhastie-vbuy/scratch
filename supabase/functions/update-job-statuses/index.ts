import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  // Move accepted → in_progress when scheduled_start has passed
  // BUT only if at least one escrow payment is held/released
  const { data: readyJobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("status", "accepted")
    .lte("scheduled_start", now);

  let startedCount = 0;
  for (const job of readyJobs ?? []) {
    const { count } = await supabase
      .from("escrow_payments")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id)
      .in("status", ["held", "released"]);

    if ((count ?? 0) > 0) {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "in_progress" })
        .eq("id", job.id)
        .eq("status", "accepted");
      if (!error) startedCount++;
    } else {
      console.log(`Job ${job.id} skipped: no confirmed payment`);
    }
  }

  // Move in_progress → completed when scheduled_end has passed
  const { data: completedJobs, error: endErr } = await supabase
    .from("jobs")
    .update({ status: "completed" })
    .eq("status", "in_progress")
    .lte("scheduled_end", now)
    .select("id");

  console.log("Status update run:", {
    started: startedCount,
    completed: completedJobs?.length ?? 0,
    errors: { endErr },
  });

  return new Response(JSON.stringify({
    started: startedCount,
    completed: completedJobs?.length ?? 0,
  }), { headers: { "Content-Type": "application/json" } });
});
