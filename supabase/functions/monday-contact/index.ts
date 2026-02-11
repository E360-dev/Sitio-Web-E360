// supabase/functions/monday-contact/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MONDAY_API_URL = "https://api.monday.com/v2";

// Monday IDs (ya definidos)
const BOARD_ID = "8423426419";
const GROUP_ID = "topics";

const COL = {
  email: "text_mkyn1d6e",
  telefono: "numeric_mkynx2t0",
  empresa: "text_mkyngd1k",
  mensaje: "text_mkyn5csp",
  fuente: "color_mkyn82tm",
  estatus: "color_mkynt339",
  fechaIngreso: "date_mkynkctz",
  // responsable: "multiple_person_mkynfwar", // opcional
};

// Ajusta estos labels si en tu Monday se llaman distinto:
const DEFAULT_FUENTE_LABEL = "Web";
const DEFAULT_ESTATUS_LABEL = "En curso";

// CORS: pon tu dominio real cuando lo tengas
const ALLOWED_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "http://localhost:5173",
  // "https://tudominio.com",
  // "https://www.tudominio.com",
]);

function corsHeaders(origin: string | null) {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : (origin ?? "*");

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(resBody: unknown, origin: string | null, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}

function sanitizePhoneToNumber(phone: string) {
  // Como tu columna es "numbers", Monday espera número.
  // Extrae dígitos; si no hay, retorna null y no se setea.
  const digits = (phone || "").replace(/[^\d]/g, "");
  if (!digits) return null;
  // Evita overflow con números muy largos: pásalo como string numérica (Monday lo acepta como value)
  return digits;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, origin, 405);
  }

  const token = Deno.env.get("MONDAY_API_TOKEN");
  if (!token) {
    return json(
      { error: "Server misconfigured: missing MONDAY_API_TOKEN" },
      origin,
      500,
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, origin, 400);
  }

  const nombre = String(body?.nombre ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const telefonoRaw = String(body?.telefono ?? "").trim();
  const empresa = String(body?.empresa ?? "").trim();
  const mensaje = String(body?.mensaje ?? "").trim();

  // Validación mínima
  if (!nombre || !email) {
    return json(
      { error: "Faltan campos requeridos: nombre y email" },
      origin,
      400,
    );
  }

  const telefono = sanitizePhoneToNumber(telefonoRaw);

  const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Column values para Monday (ojo: status usa { label: "..." })
  const column_values: Record<string, any> = {
    [COL.email]: email,
    [COL.empresa]: empresa || undefined,
    [COL.mensaje]: mensaje || undefined,
    [COL.fuente]: { label: DEFAULT_FUENTE_LABEL },
    [COL.estatus]: { label: DEFAULT_ESTATUS_LABEL },
    [COL.fechaIngreso]: { date: todayISO },
  };

  if (telefono) {
    column_values[COL.telefono] = telefono;
  }

  // Limpia undefined para no enviar ruido
  for (const k of Object.keys(column_values)) {
    if (column_values[k] === undefined) delete column_values[k];
  }

  const item_name = `Lead - ${nombre}`;

  const query = `
    mutation CreateItem($board_id: ID!, $group_id: String!, $item_name: String!, $column_values: JSON!) {
      create_item(board_id: $board_id, group_id: $group_id, item_name: $item_name, column_values: $column_values) {
        id
      }
    }
  `;

  const variables = {
    board_id: BOARD_ID,
    group_id: GROUP_ID,
    item_name,
    column_values: JSON.stringify(column_values),
  };


  const resp = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok || data?.errors) {
    return json(
      {
        error: "Monday API error",
        status: resp.status,
        details: data ?? null,
      },
      origin,
      500,
    );
  }

  return json(
    {
      ok: true,
      monday_item_id: data.data.create_item.id,
    },
    origin,
    200,
  );
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/monday-contact' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
