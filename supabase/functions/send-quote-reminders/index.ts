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
  const siteUrl = "https://bookatrade.lovable.app";

  // Find quotes that are 24+ hours old, still pending, and haven't had a reminder sent
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: quotes, error: quotesErr } = await supabase
    .from("quotes")
    .select("id, job_id, provider_user_id, created_at")
    .eq("status", "pending")
    .is("reminder_sent_at", null)
    .lte("created_at", twentyFourHoursAgo);

  if (quotesErr) {
    console.error("Error fetching quotes:", quotesErr);
    return new Response(JSON.stringify({ error: quotesErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sentCount = 0;

  for (const quote of quotes ?? []) {
    // Get job info
    const { data: job } = await supabase
      .from("jobs")
      .select("title, customer_user_id, status")
      .eq("id", quote.job_id)
      .single();

    if (!job || !["open", "quoted", "quotes_closed"].includes(job.status)) {
      // Mark as sent so we don't retry on non-active jobs
      await supabase.from("quotes").update({ reminder_sent_at: new Date().toISOString() }).eq("id", quote.id);
      continue;
    }

    // Check if customer has already replied (any message from customer in the conversation with this provider)
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", quote.job_id)
      .eq("provider_user_id", quote.provider_user_id)
      .eq("customer_user_id", job.customer_user_id)
      .maybeSingle();

    let hasReplied = false;
    if (conv) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("sender_user_id", job.customer_user_id);
      hasReplied = (count ?? 0) > 0;
    }

    if (hasReplied) {
      await supabase.from("quotes").update({ reminder_sent_at: new Date().toISOString() }).eq("id", quote.id);
      continue;
    }

    // Get customer email
    const { data: customer } = await supabase
      .from("profiles")
      .select("email, first_name")
      .eq("id", job.customer_user_id)
      .single();

    if (!customer?.email) {
      await supabase.from("quotes").update({ reminder_sent_at: new Date().toISOString() }).eq("id", quote.id);
      continue;
    }

    // Get provider name
    const { data: provider } = await supabase
      .from("provider_profiles")
      .select("business_name")
      .eq("user_id", quote.provider_user_id)
      .single();

    const providerName = provider?.business_name || "A provider";
    const firstName = customer.first_name?.trim() || "there";

    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">`
      + `<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">`
      + `<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>`
      + `</div>`
      + `<div style="padding:24px 0;">`
      + `<p style="font-size:15px;color:#333;">Hi ${firstName},</p>`
      + `<p style="font-size:15px;color:#333;">Just a friendly reminder — <strong>${providerName}</strong> submitted a quote on your job "<strong>${job.title}</strong>" over 24 hours ago and is still waiting for a response.</p>`
      + `<p style="font-size:15px;color:#333;">Reviewing and replying promptly helps avoid delays in getting your job finalised.</p>`
      + `<div style="text-align:center;padding:16px 0;">`
      + `<a href="${siteUrl}/dashboard/jobs/${quote.job_id}" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Review Quote</a>`
      + `</div>`
      + `</div>`
      + `<div style="text-align:center;padding-top:16px;border-top:1px solid #eee;">`
      + `<p style="font-size:12px;color:#aaa;margin:0;">&copy; BookATrade. All rights reserved.</p>`
      + `</div>`
      + `</div>`;

    const { error: sendErr } = await supabase.functions.invoke("send-provider-email", {
      body: {
        to: customer.email,
        subject: `BookATrade: Reminder — review ${providerName}'s quote on "${job.title}"`,
        html,
      },
    });

    if (sendErr) {
      console.error(`Failed to send reminder for quote ${quote.id}:`, sendErr);
    } else {
      sentCount++;
    }

    // Mark reminder as sent regardless to avoid repeated attempts
    await supabase.from("quotes").update({ reminder_sent_at: new Date().toISOString() }).eq("id", quote.id);
  }

  console.log(`Quote reminders sent: ${sentCount}`);

  return new Response(JSON.stringify({ sent: sentCount }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
