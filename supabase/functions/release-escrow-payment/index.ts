import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const body = await req.json();
    const { milestone_id, job_id } = body;

    // Input validation
    if (!milestone_id || typeof milestone_id !== "string" || !UUID_REGEX.test(milestone_id)) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!job_id || typeof job_id !== "string" || !UUID_REGEX.test(job_id)) {
      return new Response(JSON.stringify({ error: "Invalid job ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the job to verify customer
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();
    if (!job) throw new Error("Job not found");
    if (job.customer_user_id !== userData.user.id) throw new Error("Only the customer can release payments");

    // Verify milestone belongs to this job
    const { data: milestoneCheck } = await supabaseAdmin
      .from("job_milestones")
      .select("id")
      .eq("id", milestone_id)
      .eq("job_id", job_id)
      .single();
    if (!milestoneCheck) {
      return new Response(JSON.stringify({ error: "Milestone not found for this job" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider's platform fee
    const { data: provider } = await supabaseAdmin
      .from("provider_profiles")
      .select("platform_fee_percent")
      .eq("user_id", job.provider_id!)
      .single();
    const feePercent = provider?.platform_fee_percent ?? 10;

    // Find held payment for this milestone
    const { data: payment } = await supabaseAdmin
      .from("escrow_payments")
      .select("*")
      .eq("job_id", job_id)
      .eq("milestone_id", milestone_id)
      .eq("status", "held")
      .maybeSingle();

    if (!payment) {
      // No held payment for this milestone - might be pre-paid in bulk
      const { data: bulkPayment } = await supabaseAdmin
        .from("escrow_payments")
        .select("*")
        .eq("job_id", job_id)
        .is("milestone_id", null)
        .eq("status", "held")
        .maybeSingle();

      if (!bulkPayment) {
        return new Response(JSON.stringify({ released: false, message: "No held payment found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { data: milestone } = await supabaseAdmin
        .from("job_milestones")
        .select("payment_amount")
        .eq("id", milestone_id)
        .single();

      const milestoneAmount = milestone?.payment_amount ?? 0;
      if (milestoneAmount <= 0) {
        return new Response(JSON.stringify({ released: false, message: "No payment amount set for milestone" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const platformFee = Math.round(milestoneAmount * (feePercent / 100) * 100) / 100;
      const providerPayout = Math.round((milestoneAmount - platformFee) * 100) / 100;

      await supabaseAdmin.from("escrow_payments").insert({
        job_id,
        milestone_id,
        customer_user_id: job.customer_user_id,
        provider_user_id: job.provider_id!,
        amount: milestoneAmount,
        platform_fee: platformFee,
        provider_payout: providerPayout,
        status: "released",
      });

      const remaining = bulkPayment.amount - milestoneAmount;
      if (remaining <= 0) {
        await supabaseAdmin
          .from("escrow_payments")
          .update({ status: "released", amount: 0 })
          .eq("id", bulkPayment.id);
      } else {
        await supabaseAdmin
          .from("escrow_payments")
          .update({ amount: remaining })
          .eq("id", bulkPayment.id);
      }

      // Check if all milestones are accepted → auto-complete job (bulk path)
      const { data: allMs } = await supabaseAdmin
        .from("job_milestones")
        .select("id, status")
        .eq("job_id", job_id);
      const allDone = allMs && allMs.length > 0 && allMs.every((m: any) => m.status === "accepted");
      if (allDone && job.status !== "completed") {
        await supabaseAdmin.from("jobs").update({ status: "completed" }).eq("id", job_id);
        await supabaseAdmin.from("notifications").insert([
          {
            user_id: job.customer_user_id,
            type: "job_completed",
            title: "Job completed",
            body: `"${job.title}" is now complete. Leave a review!`,
            link: `/dashboard/jobs/${job_id}`,
          },
          {
            user_id: job.provider_id!,
            type: "job_completed",
            title: "Job completed",
            body: `"${job.title}" is now complete. Leave a review!`,
            link: `/provider/jobs/${job_id}`,
          },
        ]);
      }

      return new Response(JSON.stringify({ released: true, provider_payout: providerPayout, platform_fee: platformFee }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Release the specific milestone payment
    const platformFee = Math.round(payment.amount * (feePercent / 100) * 100) / 100;
    const providerPayout = Math.round((payment.amount - platformFee) * 100) / 100;

    await supabaseAdmin
      .from("escrow_payments")
      .update({
        status: "released",
        platform_fee: platformFee,
        provider_payout: providerPayout,
      })
      .eq("id", payment.id);

    // Notify provider
    await supabaseAdmin.from("notifications").insert({
      user_id: job.provider_id!,
      type: "payment_released",
      title: "Payment released",
      body: `£${providerPayout.toFixed(2)} has been released for "${job.title}"`,
      link: `/provider/jobs/${job_id}`,
    });

    // Check if all milestones are accepted → auto-complete job
    const { data: allMilestones } = await supabaseAdmin
      .from("job_milestones")
      .select("id, status")
      .eq("job_id", job_id);
    const allAccepted = allMilestones && allMilestones.length > 0 && allMilestones.every((m: any) => m.status === "accepted");
    if (allAccepted && job.status !== "completed") {
      await supabaseAdmin.from("jobs").update({ status: "completed" }).eq("id", job_id);

      // Notify both parties
      await supabaseAdmin.from("notifications").insert([
        {
          user_id: job.customer_user_id,
          type: "job_completed",
          title: "Job completed",
          body: `"${job.title}" is now complete. Leave a review!`,
          link: `/dashboard/jobs/${job_id}`,
        },
        {
          user_id: job.provider_id!,
          type: "job_completed",
          title: "Job completed",
          body: `"${job.title}" is now complete. Leave a review!`,
          link: `/provider/jobs/${job_id}`,
        },
      ]);
    }

    return new Response(JSON.stringify({ released: true, provider_payout: providerPayout, platform_fee: platformFee }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("release-escrow-payment error:", msg);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
