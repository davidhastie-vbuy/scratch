import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Called when a customer accepts a milestone.
 * Marks the corresponding escrow payment as 'released' and calculates
 * platform fee vs provider payout.
 * 
 * Note: Actual Stripe transfers/payouts would require Stripe Connect.
 * For now we track the release in our DB. The platform operator would
 * process the actual bank transfer to the provider separately.
 */
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

    const { milestone_id, job_id } = await req.json();
    if (!milestone_id || !job_id) throw new Error("milestone_id and job_id required");

    // Get the job to verify customer
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();
    if (!job) throw new Error("Job not found");
    if (job.customer_user_id !== userData.user.id) throw new Error("Only the customer can release payments");

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
      // Check for a bulk payment without milestone_id
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

      // For bulk payment, calculate the milestone portion
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

      // Create a release record for this milestone
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

      // Update the bulk payment amount (reduce by milestone amount)
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

    return new Response(JSON.stringify({ released: true, provider_payout: providerPayout, platform_fee: platformFee }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("release-escrow-payment error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
