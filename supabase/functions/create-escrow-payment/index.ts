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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");
    const user = userData.user;

    const body = await req.json();
    const { job_id, amount, milestone_id } = body;

    // Input validation
    if (!job_id || typeof job_id !== "string" || !UUID_REGEX.test(job_id)) {
      return new Response(JSON.stringify({ error: "Invalid job ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof amount !== "number" || !isFinite(amount) || amount <= 0 || amount > 1000000) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (milestone_id && (typeof milestone_id !== "string" || !UUID_REGEX.test(milestone_id))) {
      return new Response(JSON.stringify({ error: "Invalid milestone ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();
    if (jobError || !job) throw new Error("Job not found");
    if (job.customer_user_id !== user.id) throw new Error("Only the customer can make payments");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email! });
      customerId = customer.id;
    }

    // Create checkout session for the payment amount (in pence)
    const amountInPence = Math.round(amount * 100);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: amountInPence,
            product_data: {
              name: `Payment for: ${job.title}`,
              description: milestone_id
                ? "Milestone payment held in escrow"
                : "Job payment held in escrow",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        metadata: {
          job_id,
          milestone_id: milestone_id || "",
          customer_user_id: user.id,
          provider_user_id: job.provider_id || "",
          type: "escrow",
        },
      },
      success_url: `${req.headers.get("origin")}/dashboard/jobs/${job_id}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard/jobs/${job_id}?payment=cancelled`,
    });

    // Create escrow payment record
    await supabaseAdmin.from("escrow_payments").insert({
      job_id,
      milestone_id: milestone_id || null,
      customer_user_id: user.id,
      provider_user_id: job.provider_id,
      amount,
      status: "pending",
      stripe_checkout_session_id: session.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("create-escrow-payment error:", msg);
    // Return generic message for non-validation errors
    const safeMessages = ["Unauthorized", "Only the customer can make payments", "Job not found"];
    const safeMsg = safeMessages.includes(msg) ? msg : "An error occurred. Please try again.";
    return new Response(JSON.stringify({ error: safeMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: msg === "Unauthorized" ? 401 : 500,
    });
  }
});
