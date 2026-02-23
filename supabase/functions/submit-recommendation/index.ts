import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const formData = await req.formData();
    const message = formData.get("message") as string | null;
    const customerName = formData.get("customer_name") as string | null;
    const customerPostcode = formData.get("customer_postcode") as string | null;
    const photos = formData.getAll("photos");

    if (!message && photos.length === 0) {
      return new Response(JSON.stringify({ error: "Nothing to submit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate message length
    if (message && message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long (max 2000 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate photo count
    const validPhotos = photos.filter((p) => p instanceof File && p.size > 0);
    if (validPhotos.length > MAX_PHOTOS) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_PHOTOS} photos allowed` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const photoUrls: string[] = [];

    for (const photo of validPhotos) {
      if (!(photo instanceof File)) continue;

      // Validate file type
      if (!ALLOWED_TYPES.includes(photo.type)) {
        return new Response(JSON.stringify({ error: `Invalid file type: ${photo.type}. Only JPEG, PNG, and WebP allowed.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate file size
      if (photo.size > MAX_PHOTO_SIZE) {
        return new Response(JSON.stringify({ error: `File too large (max 5MB per photo)` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ext = photo.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("recommendation-photos")
        .upload(path, photo, { contentType: photo.type });

      if (!uploadError) {
        // Store the path, not public URL (bucket is now private)
        photoUrls.push(path);
      } else {
        console.error("Upload error:", uploadError);
      }
    }

    const { error: insertError } = await supabase
      .from("customer_recommendations")
      .insert({
        user_id: user.id,
        user_email: user.email || null,
        message: message?.trim() || null,
        photo_urls: photoUrls,
        customer_name: customerName?.trim().slice(0, 200) || null,
        customer_postcode: customerPostcode?.trim().slice(0, 10) || null,
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
