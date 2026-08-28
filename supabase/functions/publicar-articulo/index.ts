// supabase/functions/publicar-articulo/index.ts
//
// Dispara la reconstrucción del sitio cuando se publica o edita un artículo.
//
// El contenido del blog se empaqueta en tiempo de compilación (ver
// scripts/generar-contenido.mjs), así que publicar en la base de datos no basta:
// hace falta volver a compilar y desplegar. Esta función avisa a GitHub
// Actions, que ya escucha el evento `contenido-actualizado`.
//
// Secretos necesarios en Supabase:
//   GITHUB_TOKEN  - token con permiso de escritura sobre el repositorio
//   GITHUB_REPO   - por ejemplo "E360-dev/Sitio-Web-E360"

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (cuerpo: Record<string, unknown>, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const token = Deno.env.get("GITHUB_TOKEN");
  const repo = Deno.env.get("GITHUB_REPO");

  if (!token || !repo) {
    console.error("Faltan los secretos GITHUB_TOKEN o GITHUB_REPO.");
    return responder(
      { ok: false, message: "El despliegue automático no está configurado." },
      500,
    );
  }

  try {
    const respuesta = await fetch(
      `https://api.github.com/repos/${repo}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_type: "contenido-actualizado" }),
      },
    );

    // GitHub responde 204 sin cuerpo cuando acepta el evento.
    if (respuesta.status !== 204) {
      const detalle = await respuesta.text();
      console.error(`GitHub respondió ${respuesta.status}: ${detalle}`);
      return responder(
        { ok: false, message: `GitHub rechazó la petición (${respuesta.status}).` },
        502,
      );
    }

    return responder({ ok: true, message: "Reconstrucción del sitio en marcha." });
  } catch (error) {
    console.error("Error al contactar con GitHub:", error);
    return responder({ ok: false, message: "No se pudo contactar con GitHub." }, 502);
  }
});
