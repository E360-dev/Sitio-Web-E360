import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand,
} from "npm:@aws-sdk/client-ec2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REGION = Deno.env.get("AWS_REGION")!;
const ACCESS_KEY = Deno.env.get("AWS_ACCESS_KEY_ID")!;
const SECRET_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY")!;
const INSTANCE_ID = Deno.env.get("INSTANCE_ID")!;

const ec2 = new EC2Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

// Solo estos roles pueden encender, apagar o consultar el servidor.
const ROLES_PERMITIDOS = ["admin", "auditor"];

// verify_jwt solo exige un JWT válido, y la clave anon pública ya lo es.
// Por eso el rol se comprueba aquí, con la sesión de quien llama.
async function rechazarSinRol(req: Request): Promise<Response | null> {
  const responder = (error: string, status: number) =>
    new Response(JSON.stringify({ error }), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return responder("No authorization header", 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return responder("Invalid user", 401);

  const { data: rolData, error: rolError } = await supabase
    .from("roles_usuario")
    .select("rol")
    .eq("user_id", user.id)
    .single();

  if (rolError || !ROLES_PERMITIDOS.includes(rolData?.rol)) {
    return responder("Unauthorized", 403);
  }
  return null;
}

serve(async (req) => {
  // Manejo explícito de preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rechazo = await rechazarSinRol(req);
  if (rechazo) return rechazo;

  try {
    const { action } = await req.json();

    if (action === "start") {
      await ec2.send(
        new StartInstancesCommand({
          InstanceIds: [INSTANCE_ID],
        })
      );
      return new Response(JSON.stringify({ status: "starting" }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    if (action === "stop") {
      await ec2.send(
        new StopInstancesCommand({
          InstanceIds: [INSTANCE_ID],
        })
      );
      return new Response(JSON.stringify({ status: "stopping" }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    if (action === "status") {
      const data = await ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [INSTANCE_ID],
        })
      );

      const state =
        data.Reservations?.[0]?.Instances?.[0]?.State?.Name ?? "unknown";

      return new Response(JSON.stringify({ status: state }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { 
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
