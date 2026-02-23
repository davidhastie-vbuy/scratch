import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const userId = formData.get("user_id") as string;

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the provider profile created by the trigger
    const { data: profile, error: profileErr } = await supabase
      .from("provider_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileErr || !profile) {
      return new Response(
        JSON.stringify({ error: "Provider profile not found. It may not have been created yet." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const files = formData.getAll("documents") as File[];
    const uploaded: string[] = [];

    for (const file of files) {
      const storagePath = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("provider-documents")
        .upload(storagePath, file);

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        continue;
      }

      const { error: insertErr } = await supabase.from("provider_documents").insert({
        provider_profile_id: profile.id,
        user_id: userId,
        file_url: storagePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      if (insertErr) {
        console.error("Document record insert error:", insertErr);
        continue;
      }

      uploaded.push(file.name);
    }

    return new Response(
      JSON.stringify({ success: true, uploaded_count: uploaded.length, files: uploaded }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
