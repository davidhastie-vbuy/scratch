import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const userId = formData.get("user_id") as string | null;
    const userEmail = formData.get("user_email") as string | null;
    const message = formData.get("message") as string | null;
    const customerName = formData.get("customer_name") as string | null;
    const customerPostcode = formData.get("customer_postcode") as string | null;

    if (!message && formData.getAll("photos").length === 0) {
      return new Response(JSON.stringify({ error: "Nothing to submit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const photoUrls: string[] = [];
    const photos = formData.getAll("photos");

    for (const photo of photos) {
      if (photo instanceof File && photo.size > 0) {
        const ext = photo.name.split(".").pop() || "jpg";
        const path = `${userId || "anon"}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("recommendation-photos")
          .upload(path, photo, { contentType: photo.type });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("recommendation-photos")
            .getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        } else {
          console.error("Upload error:", uploadError);
        }
      }
    }

    const { error: insertError } = await supabase
      .from("customer_recommendations")
      .insert({
        user_id: userId || null,
        user_email: userEmail || null,
        message: message || null,
        photo_urls: photoUrls,
        customer_name: customerName || null,
        customer_postcode: customerPostcode || null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save recommendation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
