import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: { user }, error: userErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();

  // 1. Reopen accepted jobs where start date has passed but NO payment was made
  const { data: acceptedJobs } = await supabase
    .from("jobs")
    .select("id, provider_id, title")
    .eq("status", "accepted")
    .lte("scheduled_start", now);

  let reopenedCount = 0;
  if (acceptedJobs && acceptedJobs.length > 0) {
    for (const job of acceptedJobs) {
      const { count } = await supabase
        .from("escrow_payments")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .in("status", ["held", "released"]);

      if ((count ?? 0) === 0) {
        await supabase.from("jobs").update({
          status: "open",
          provider_id: null,
          agreed_price: null,
          scheduled_start: null,
          scheduled_end: null,
          milestones_confirmed: false,
        }).eq("id", job.id);

        await supabase.from("quotes").update({ status: "withdrawn" })
          .eq("job_id", job.id)
          .eq("provider_user_id", job.provider_id);

        await supabase.from("quotes").update({ status: "pending" })
          .eq("job_id", job.id)
          .eq("status", "declined");

        await supabase.from("job_milestones").delete().eq("job_id", job.id);

        await supabase.from("notifications").insert({
          user_id: job.provider_id,
          type: "job_reopened",
          title: "Job reopened",
          body: `"${job.title}" has been reopened because the customer did not make payment before the start date.`,
          link: "/provider/jobs",
        });

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

  // 4. Auto-cancel ONLY unaccepted jobs inactive for 14+ days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  let cancelledCount = 0;

  const { data: staleUnaccepted } = await supabase
    .from("jobs")
    .select("id, title, customer_user_id")
    .in("status", ["open", "quoted", "quotes_closed"])
    .lte("updated_at", fourteenDaysAgo);

  if (staleUnaccepted && staleUnaccepted.length > 0) {
    for (const job of staleUnaccepted) {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .eq("job_id", job.id);

      const convIds = convs?.map((c: any) => c.id) ?? [];
      let hasRecentActivity = false;

      if (convIds.length > 0) {
        const { data: recentMsg } = await supabase
          .from("messages")
          .select("id")
          .in("conversation_id", convIds)
          .gte("created_at", fourteenDaysAgo)
          .limit(1);

        hasRecentActivity = (recentMsg?.length ?? 0) > 0;
      }

      if (!hasRecentActivity) {
        await supabase.from("jobs").update({ status: "cancelled" }).eq("id", job.id);

        await supabase.from("notifications").insert({
          user_id: job.customer_user_id,
          type: "job_auto_cancelled",
          title: "Job auto-cancelled",
          body: `"${job.title}" was automatically cancelled due to 14 days of inactivity.`,
          link: "/dashboard/jobs/" + job.id,
        });

        cancelledCount++;
      }
    }
  }

  console.log("Status update run:", {
    reopened: reopenedCount,
    started: startedJobs?.length ?? 0,
    cancelled: cancelledCount,
    errors: { startErr },
  });

  return new Response(JSON.stringify({
    reopened: reopenedCount,
    started: startedJobs?.length ?? 0,
    cancelled: cancelledCount,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
