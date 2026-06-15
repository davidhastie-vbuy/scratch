import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
      first_name?: string;
    };
  };
  email_data: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    confirmation_url?: string;
    email_action_type: string;
  };
}

// TODO: Change back to "https://bookatrade.io" once the domain is pointed to Cloud Run
const SITE_URL = Deno.env.get("SITE_URL") || "https://bookatrade-204505856132.europe-west2.run.app";

function buildConfirmationUrl(emailData: AuthEmailPayload["email_data"]): string {
  const tokenHash = emailData.token_hash || "";
  const type = emailData.email_action_type === "signup" ? "signup" : emailData.email_action_type;
  return `${SITE_URL}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;
}

function getUserName(user: AuthEmailPayload["user"]): string {
  return user.user_metadata?.full_name || user.user_metadata?.first_name || "";
}

/* ══════════════════════════════════════════════════════════
   BOOKaTRADE Email Shell
   Design system: Charcoal #252525, Red #B00010, Parchment #F7F4EF
   Square edges (no border-radius), Helvetica Neue / Arial
══════════════════════════════════════════════════════════ */
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#F7F4EF;font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF;">
    <tr><td align="center" style="padding:48px 20px 40px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr><td style="padding-bottom:36px;text-align:center;">
          <span style="font-size:22px;font-weight:800;color:#252525;letter-spacing:-0.5px;">BOOK<span style="color:#B00010;">a</span>TRADE</span>
        </td></tr>
        <!-- Content card -->
        <tr><td style="background-color:#ffffff;padding:40px 36px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="font-size:11px;color:#252525;opacity:0.35;margin:0;letter-spacing:0.08em;text-transform:uppercase;">
            © ${new Date().getFullYear()} BOOKaTRADE Ltd. All rights reserved.
          </p>
          <p style="font-size:11px;color:#252525;opacity:0.25;margin:8px 0 0;">
            Connecting homes with trusted tradespeople across the UK.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" target="_blank" style="display:inline-block;background-color:#252525;color:#F7F4EF;font-size:12px;font-weight:700;text-decoration:none;padding:14px 36px;letter-spacing:0.1em;text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif;">${text}</a>`;
}

function generateSignupEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BOOKaTRADE — Please confirm your email address",
    html: emailShell(`
          <h1 style="font-size:20px;font-weight:700;color:#252525;margin:0 0 20px;letter-spacing:-0.3px;">${greeting}</h1>
          <p style="font-size:15px;color:#252525;opacity:0.6;line-height:1.65;margin:0 0 24px;">
            Thanks for signing up to BOOKaTRADE. Please confirm your email address by clicking the button below.
          </p>
          <div style="text-align:center;padding:8px 0 28px;">
            ${ctaButton("Confirm Email Address", confirmUrl)}
          </div>
          <p style="font-size:13px;color:#252525;opacity:0.45;line-height:1.5;margin:0 0 16px;">
            If you didn't create an account with BOOKaTRADE, you can safely ignore this email.
          </p>
          <p style="font-size:13px;color:#252525;opacity:0.3;margin:20px 0 0;">— The BOOKaTRADE Team</p>
    `),
  };
}

function generateRecoveryEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BOOKaTRADE — Reset your password",
    html: emailShell(`
          <h1 style="font-size:20px;font-weight:700;color:#252525;margin:0 0 20px;letter-spacing:-0.3px;">${greeting}</h1>
          <p style="font-size:15px;color:#252525;opacity:0.6;line-height:1.65;margin:0 0 24px;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <div style="text-align:center;padding:8px 0 28px;">
            ${ctaButton("Reset Password", confirmUrl)}
          </div>
          <p style="font-size:13px;color:#252525;opacity:0.45;line-height:1.5;margin:0 0 16px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <p style="font-size:13px;color:#252525;opacity:0.3;margin:20px 0 0;">— The BOOKaTRADE Team</p>
    `),
  };
}

function generateMagicLinkEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BOOKaTRADE — Your login link",
    html: emailShell(`
          <h1 style="font-size:20px;font-weight:700;color:#252525;margin:0 0 20px;letter-spacing:-0.3px;">${greeting}</h1>
          <p style="font-size:15px;color:#252525;opacity:0.6;line-height:1.65;margin:0 0 24px;">
            Click the button below to log in to your BOOKaTRADE account.
          </p>
          <div style="text-align:center;padding:8px 0 28px;">
            ${ctaButton("Log In", confirmUrl)}
          </div>
          <p style="font-size:13px;color:#252525;opacity:0.45;line-height:1.5;margin:0 0 16px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
          <p style="font-size:13px;color:#252525;opacity:0.3;margin:20px 0 0;">— The BOOKaTRADE Team</p>
    `),
  };
}

function generateEmailChangeEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BOOKaTRADE — Confirm your email change",
    html: emailShell(`
          <h1 style="font-size:20px;font-weight:700;color:#252525;margin:0 0 20px;letter-spacing:-0.3px;">${greeting}</h1>
          <p style="font-size:15px;color:#252525;opacity:0.6;line-height:1.65;margin:0 0 24px;">
            Please confirm your email address change by clicking the button below.
          </p>
          <div style="text-align:center;padding:8px 0 28px;">
            ${ctaButton("Confirm Email Change", confirmUrl)}
          </div>
          <p style="font-size:13px;color:#252525;opacity:0.45;line-height:1.5;margin:0 0 16px;">
            If you didn't request this change, please contact our support team immediately.
          </p>
          <p style="font-size:13px;color:#252525;opacity:0.3;margin:20px 0 0;">— The BOOKaTRADE Team</p>
    `),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const payload: AuthEmailPayload = await req.json();
    const { user, email_data } = payload;
    const name = getUserName(user);
    const confirmUrl = buildConfirmationUrl(email_data);

    let emailContent: { subject: string; html: string };

    switch (email_data.email_action_type) {
      case "signup":
        emailContent = generateSignupEmail(name, confirmUrl);
        break;
      case "recovery":
        emailContent = generateRecoveryEmail(name, confirmUrl);
        break;
      case "magic_link":
      case "magiclink":
        emailContent = generateMagicLinkEmail(name, confirmUrl);
        break;
      case "email_change":
      case "email_change_new":
      case "email_change_current":
        emailContent = generateEmailChangeEmail(name, confirmUrl);
        break;
      default:
        emailContent = generateSignupEmail(name, confirmUrl);
        break;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BOOKaTRADE <support@bookatrade.io>",
        to: [user.email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send auth email." }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("auth-email-hook error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
