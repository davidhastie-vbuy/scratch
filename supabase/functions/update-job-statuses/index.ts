import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  // 1. Reopen accepted jobs where start date has passed but NO payment was made
  // These go back to "open" so other providers can quote
  const { data: acceptedJobs } = await supabase
    .from("jobs")
    .select("id, provider_id, title")
    .eq("status", "accepted")
    .lte("scheduled_start", now);

  let reopenedCount = 0;
  if (acceptedJobs && acceptedJobs.length > 0) {
    for (const job of acceptedJobs) {
      // Check if any escrow payment is held or released (i.e. customer paid)
      const { count } = await supabase
        .from("escrow_payments")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .in("status", ["held", "released"]);

      if ((count ?? 0) === 0) {
        // No payment made - reopen the job
        await supabase.from("jobs").update({
          status: "open",
          provider_id: null,
          agreed_price: null,
          scheduled_start: null,
          scheduled_end: null,
          milestones_confirmed: false,
        }).eq("id", job.id);

        // Reset quotes back to pending so the slot opens up
        await supabase.from("quotes").update({ status: "withdrawn" })
          .eq("job_id", job.id)
          .eq("provider_user_id", job.provider_id);

        // Un-decline other quotes
        await supabase.from("quotes").update({ status: "pending" })
          .eq("job_id", job.id)
          .eq("status", "declined");

        // Delete milestones
        await supabase.from("job_milestones").delete().eq("job_id", job.id);

        // Notify customer
        await supabase.from("notifications").insert({
          user_id: job.provider_id,
          type: "job_reopened",
          title: "Job reopened",
          body: `"${job.title}" has been reopened because the customer did not make payment before the start date.`,
          link: "/provider/jobs",
        });

        // Send system message to conversation
        const { data: conv } = await supabase
          .from("conversations")
          .select("id, customer_user_id")
          .eq("job_id", job.id)
          .eq("provider_user_id", job.provider_id)
          .maybeSingle();

        if (conv) {
          await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_user_id: conv.customer_user_id,
            body: "⚠️ This job has been reopened because payment was not made before the scheduled start date. The agreement has been cancelled.",
            message_type: "system",
          });
        }

        reopenedCount++;
      }
    }
  }

  // 2. Move accepted → in_progress when scheduled_start has passed (only if paid)
  const { data: startedJobs, error: startErr } = await supabase
    .from("jobs")
    .update({ status: "in_progress" })
    .eq("status", "accepted")
    .lte("scheduled_start", now)
    .select("id");

  // 3. Jobs remain in_progress until all milestones are completed and accepted
  // (handled by auto_complete_job_on_all_released trigger)

  console.log("Status update run:", {
    reopened: reopenedCount,
    started: startedJobs?.length ?? 0,
    errors: { startErr },
  });

  return new Response(JSON.stringify({
    reopened: reopenedCount,
    started: startedJobs?.length ?? 0,
  }), { headers: { "Content-Type": "application/json" } });
});
