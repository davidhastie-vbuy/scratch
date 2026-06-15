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
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");
    const providerUserId = userData.user.id;

    const { job_id, milestone_id } = await req.json();

    if (!job_id || !UUID_REGEX.test(job_id) || !milestone_id || !UUID_REGEX.test(milestone_id)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("id, title, customer_user_id, provider_id")
      .eq("id", job_id)
      .single();
    if (!job) throw new Error("Job not found");
    if (job.provider_id !== providerUserId) throw new Error("Not the assigned provider");

    // Fetch milestone
    const { data: milestone } = await supabaseAdmin
      .from("job_milestones")
      .select("id, title, payment_amount")
      .eq("id", milestone_id)
      .single();
    if (!milestone) throw new Error("Milestone not found");

    // Create in-app notification for customer
    const paymentText = milestone.payment_amount
      ? ` (£${Number(milestone.payment_amount).toFixed(2)})`
      : "";
    await supabaseAdmin.from("notifications").insert({
      user_id: job.customer_user_id,
      type: "milestone_completed",
      title: "Milestone marked as complete",
      body: `The provider has marked "${milestone.title}"${paymentText} as complete for "${job.title}". Please review and accept to release the payment, or query if you have concerns.`,
      link: `/dashboard/jobs/${job_id}`,
    });

    // Send email to customer
    const { data: customerProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, first_name")
      .eq("id", job.customer_user_id)
      .single();

    if (customerProfile?.email) {
      const customerName = customerProfile.first_name || "there";
      const origin = req.headers.get("origin") || "https://bookatrade.io";
      const jobLink = `${origin}/dashboard/jobs/${job_id}`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a1a2e;margin-bottom:16px;">Milestone Completed</h2>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Hi ${customerName},
          </p>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Great news! The provider has marked the milestone <strong>"${milestone.title}"</strong>${paymentText} as complete for your job <strong>"${job.title}"</strong>.
          </p>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Please review the work and either accept the milestone to release the payment, or raise a query if you have any concerns.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${jobLink}" style="display:inline-block;background-color:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
              Review Milestone
            </a>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            — The BookATrade Team
          </p>
        </div>
      `;

      await supabaseAdmin.functions.invoke("send-provider-email", {
        body: {
          to: customerProfile.email,
          subject: `Milestone completed: "${milestone.title}" — ${job.title}`,
          html,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("notify-milestone-complete error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
