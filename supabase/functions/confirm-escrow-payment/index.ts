import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const { job_id } = body;

    // Input validation
    if (!job_id || typeof job_id !== "string" || !UUID_REGEX.test(job_id)) {
      return new Response(JSON.stringify({ error: "Invalid job ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get pending escrow payments for this job
    const { data: payments } = await supabaseAdmin
      .from("escrow_payments")
      .select("*")
      .eq("job_id", job_id)
      .eq("status", "pending")
      .not("stripe_checkout_session_id", "is", null);

    let confirmed = 0;
    for (const payment of (payments ?? [])) {
      try {
        const session = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id!);
        if (session.payment_status === "paid") {
          await supabaseAdmin
            .from("escrow_payments")
            .update({
              status: "held",
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("id", payment.id);
          confirmed++;
        }
      } catch (e) {
        console.error(`Failed to verify session ${payment.stripe_checkout_session_id}:`, e);
      }
    }

    return new Response(JSON.stringify({ confirmed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("confirm-escrow-payment error:", msg);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
