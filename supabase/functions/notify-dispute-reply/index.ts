import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    // Authenticate caller as admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { dispute_id, body, conversation_id, job_id } = await req.json();
    if (!dispute_id || !body || !job_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job to get customer and provider IDs
    const { data: job } = await supabaseAdmin
      .from("jobs")
      .select("id, title, customer_user_id, provider_id")
      .eq("id", job_id)
      .single();
    if (!job) throw new Error("Job not found");

    // Post to conversation so both parties can see it
    if (conversation_id) {
      await supabaseAdmin.from("messages").insert({
        conversation_id,
        sender_user_id: userData.user.id,
        body: `⚖️ Admin (Dispute): ${body}`,
        message_type: "system",
      });
    }

    // Create in-app notifications for both parties
    const notifyUserIds = [job.customer_user_id, job.provider_id].filter(Boolean);
    const notifications = notifyUserIds.map((uid) => ({
      user_id: uid,
      type: "dispute_update",
      title: "Dispute Update",
      body: `An admin has responded to the dispute on "${job.title}": ${body.substring(0, 120)}${body.length > 120 ? "…" : ""}`,
      link: `/dashboard/jobs/${job_id}`,
    }));
    if (notifications.length > 0) {
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    // Send emails to both parties
    const origin = req.headers.get("origin") || "https://bookatrade.lovable.app";
    const jobLink = `${origin}/dashboard/jobs/${job_id}`;

    for (const userId of notifyUserIds) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, first_name")
        .eq("id", userId)
        .single();

      if (!profile?.email) continue;

      // If provider, check email preference
      if (userId === job.provider_id) {
        const { data: pp } = await supabaseAdmin
          .from("provider_profiles")
          .select("email_notifications_enabled")
          .eq("user_id", userId)
          .maybeSingle();
        if (pp && !pp.email_notifications_enabled) continue;
      }

      const recipientName = profile.first_name || "there";
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#1a1a2e;margin-bottom:16px;">Dispute Update</h2>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Hi ${recipientName},
          </p>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            An admin has posted an update regarding the dispute on your job <strong>"${job.title}"</strong>:
          </p>
          <div style="background:#f5f5f5;padding:12px 16px;border-left:4px solid #1a1a2e;margin:16px 0;border-radius:4px;">
            <p style="color:#333;font-size:14px;line-height:1.6;margin:0;">
              ${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </p>
          </div>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Please review and respond if needed.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${jobLink}" style="display:inline-block;background-color:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
              View Job
            </a>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            — The TradeTrust Team
          </p>
        </div>
      `;

      await supabaseAdmin.functions.invoke("send-provider-email", {
        body: {
          to: profile.email,
          subject: `Dispute update on "${job.title}" — TradeTrust`,
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
    console.error("notify-dispute-reply error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
