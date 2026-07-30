const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Headers comunes para la REST API de Supabase
function getHeaders() {
  return {
    apikey: supabaseServiceRoleKey,
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
  };
}

// Buscar usuario por email en auth.users
export async function getUserByEmail(email: string) {
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users`,
    {
      headers: getHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error(`Error buscando usuarios: ${res.statusText}`);
  }

  const data = await res.json();
  const user = data.users?.find(
    (u: { email: string }) => u.email === email
  );

  return user || null;
}

// Insertar un registro en una tabla
export async function insertRow(table: string, row: Record<string, unknown>) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/${table}`,
    {
      method: "POST",
      headers: {
        ...getHeaders(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Error insertando en ${table}`);
  }

  const data = await res.json();
  return data[0];
}

// Consultar registros de una tabla con filtros
export async function selectRows(table: string, filters: string = "") {
  const url = `${supabaseUrl}/rest/v1/${table}?${filters}`;
  const res = await fetch(url, {
    headers: {
      ...getHeaders(),
      Prefer: "return=representation",
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Error consultando ${table}`);
  }

  return res.json();
}
