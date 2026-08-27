import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

serve(async (req) => {
  // Manejo explícito de preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
