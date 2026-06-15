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

function generateSignupEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BookATrade — Please confirm your email address",
    html: `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#ffffff;font-family:'Manrope',Arial,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:30px;text-align:center;">
          <span style="font-size:24px;font-weight:700;color:#1e293b;">Book<span style="color:#f97316;">A</span>Trade</span>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <h1 style="font-size:22px;font-weight:bold;color:#1e293b;margin:0 0 20px;">${greeting}</h1>
          <p style="font-size:15px;color:#55575d;line-height:1.6;margin:0 0 16px;">
            Thanks for signing up to BookATrade! Please confirm your email address by clicking the button below.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:10px 0 30px;">
          <a href="${confirmUrl}" target="_blank" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
            Confirm Email Address
          </a>
        </td></tr>
        <tr><td>
          <p style="font-size:13px;color:#55575d;line-height:1.5;margin:0 0 16px;">
            If you didn't create an account with BookATrade, you can safely ignore this email.
          </p>
          <p style="font-size:13px;color:#999999;margin:20px 0 0;">— The BookATrade Team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function generateRecoveryEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BookATrade — Reset your password",
    html: `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#ffffff;font-family:'Manrope',Arial,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:30px;text-align:center;">
          <span style="font-size:24px;font-weight:700;color:#1e293b;">Book<span style="color:#f97316;">A</span>Trade</span>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <h1 style="font-size:22px;font-weight:bold;color:#1e293b;margin:0 0 20px;">${greeting}</h1>
          <p style="font-size:15px;color:#55575d;line-height:1.6;margin:0 0 16px;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:10px 0 30px;">
          <a href="${confirmUrl}" target="_blank" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
            Reset Password
          </a>
        </td></tr>
        <tr><td>
          <p style="font-size:13px;color:#55575d;line-height:1.5;margin:0 0 16px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <p style="font-size:13px;color:#999999;margin:20px 0 0;">— The BookATrade Team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function generateMagicLinkEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BookATrade — Your login link",
    html: `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#ffffff;font-family:'Manrope',Arial,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:30px;text-align:center;">
          <span style="font-size:24px;font-weight:700;color:#1e293b;">Book<span style="color:#f97316;">A</span>Trade</span>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <h1 style="font-size:22px;font-weight:bold;color:#1e293b;margin:0 0 20px;">${greeting}</h1>
          <p style="font-size:15px;color:#55575d;line-height:1.6;margin:0 0 16px;">
            Click the button below to log in to your BookATrade account.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:10px 0 30px;">
          <a href="${confirmUrl}" target="_blank" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
            Log In
          </a>
        </td></tr>
        <tr><td>
          <p style="font-size:13px;color:#55575d;line-height:1.5;margin:0 0 16px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
          <p style="font-size:13px;color:#999999;margin:20px 0 0;">— The BookATrade Team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function generateEmailChangeEmail(name: string, confirmUrl: string): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "BookATrade — Confirm your email change",
    html: `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#ffffff;font-family:'Manrope',Arial,sans-serif;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:30px;text-align:center;">
          <span style="font-size:24px;font-weight:700;color:#1e293b;">Book<span style="color:#f97316;">A</span>Trade</span>
        </td></tr>
        <tr><td style="padding-bottom:20px;">
          <h1 style="font-size:22px;font-weight:bold;color:#1e293b;margin:0 0 20px;">${greeting}</h1>
          <p style="font-size:15px;color:#55575d;line-height:1.6;margin:0 0 16px;">
            Please confirm your email address change by clicking the button below.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:10px 0 30px;">
          <a href="${confirmUrl}" target="_blank" style="display:inline-block;background-color:#f97316;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
            Confirm Email Change
          </a>
        </td></tr>
        <tr><td>
          <p style="font-size:13px;color:#55575d;line-height:1.5;margin:0 0 16px;">
            If you didn't request this change, please contact our support team immediately.
          </p>
          <p style="font-size:13px;color:#999999;margin:20px 0 0;">— The BookATrade Team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
        from: "BookATrade <support@bookatrade.io>",
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
