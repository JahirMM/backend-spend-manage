import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("========== DEBUG SUPABASE ==========");
  console.log("SUPABASE_URL:", supabaseUrl);
  console.log("SUPABASE_KEY existe:", !!supabaseKey);
  console.log("SUPABASE_KEY length:", supabaseKey?.length);
  console.log("SUPABASE_KEY prefix:", supabaseKey?.substring(0, 20));

  if (!supabaseUrl || !supabaseKey) {
    console.log("ERROR: Variables de entorno no definidas");
    return NextResponse.json(
      { error: "Variables de entorno no configuradas" },
      { status: 500 }
    );
  }

  const fullUrl = `${supabaseUrl}/rest/v1/users?select=*`;
  console.log("URL completa:", fullUrl);

  try {
    console.log("Iniciando fetch...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(fullUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("Fetch completado!");
    console.log("Status:", res.status);
    console.log("StatusText:", res.statusText);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));

    const text = await res.text();
    console.log("Body:", text);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Supabase respondió con error", status: res.status, body: text },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    console.log("========== ERROR CATCH ==========");
    console.log("Error name:", err instanceof Error ? err.name : "unknown");
    console.log("Error message:", err instanceof Error ? err.message : String(err));
    console.log("Error cause:", err instanceof Error ? (err as NodeJS.ErrnoException).cause : "none");
    console.log("Error stack:", err instanceof Error ? err.stack : "none");

    const errorInfo = {
      error: err instanceof Error ? `${err.name}: ${err.message}` : "Error desconocido",
      cause: err instanceof Error ? String((err as NodeJS.ErrnoException).cause) : null,
      url_used: fullUrl,
    };

    return NextResponse.json(errorInfo, { status: 500 });
  }
}
