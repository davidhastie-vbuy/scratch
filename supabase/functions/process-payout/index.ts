import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { payout_request_id, provider_user_id, amount } = body;

    // Validate UUID formats
    if (!payout_request_id || typeof payout_request_id !== "string" || !UUID_REGEX.test(payout_request_id)) {
      return new Response(JSON.stringify({ error: "Invalid payout request ID" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!provider_user_id || typeof provider_user_id !== "string" || !UUID_REGEX.test(provider_user_id)) {
      return new Response(JSON.stringify({ error: "Invalid provider ID" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Validate amount is a positive number within bounds
    if (typeof amount !== "number" || !isFinite(amount) || amount <= 0 || amount > 100000) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Cross-check against the actual payout request record
    const { data: payoutRequest, error: prErr } = await supabase
      .from("payout_requests")
      .select("amount, provider_user_id, status")
      .eq("id", payout_request_id)
      .single();

    if (prErr || !payoutRequest) {
      return new Response(JSON.stringify({ error: "Payout request not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (payoutRequest.provider_user_id !== provider_user_id) {
      return new Response(JSON.stringify({ error: "Provider mismatch" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (payoutRequest.status !== "pending") {
      return new Response(JSON.stringify({ error: "Payout request is not pending" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (Number(payoutRequest.amount) !== amount) {
      return new Response(JSON.stringify({ error: "Amount mismatch with payout request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert a negative payout transaction
    const { error: txErr } = await supabase.from("provider_transactions").insert({
      provider_user_id,
      type: "payout",
      amount: -Math.abs(amount),
      description: "Payout approved",
      payout_request_id,
    });

    if (txErr) {
      console.error("Transaction insert error:", txErr);
      return new Response(JSON.stringify({ error: "Failed to process payout" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Process payout error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
