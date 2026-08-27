// supabase/functions/enviar-correo-manual/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1️⃣ Obtener token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // 2️⃣ Obtener usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 3️⃣ Verificar rol admin
    const { data: rolData, error: rolError } = await supabase
      .from("roles_usuario")
      .select("rol")
      .eq("user_id", user.id)
      .single();

    if (rolError || rolData?.rol !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin only" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 4️⃣ Reenviar multipart a n8n
    const formData = await req.formData();

    const n8nResponse = await fetch(
      Deno.env.get("N8N_WEBHOOK_URL")!,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      return new Response(
        JSON.stringify({ error: "n8n error", details: errorText }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", details: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
