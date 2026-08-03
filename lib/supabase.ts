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
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Error buscando usuarios: ${res.statusText}`);
  }

  const data = await res.json();
  const user = data.users?.find((u: { email: string }) => u.email === email);

  return user || null;
}

// Insertar un registro en una tabla
export async function insertRow<T extends object, R = T>(
  table: string,
  row: T,
): Promise<R> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Error insertando en ${table}`);
  }

  const data = await res.json();
  return data[0] as R;
}

// Consultar registros de una tabla con filtros
export async function selectRows<R = unknown>(
  table: string,
  filters: string = "",
): Promise<R> {
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

// Buscar usuario por id en auth.users
export async function getUserById(userId: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Error buscando usuario por id: ${res.statusText}`);
  }

  const user = await res.json();
  return user || null;
}

// Actualizar un registro en una tabla por id
export async function updateRow<T extends object, R = T>(
  table: string,
  id: string,
  patch: T,
): Promise<R> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      ...getHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Error actualizando en ${table}`);
  }

  const data = await res.json();
  return data[0] as R;
}

// Actualizar registros en una tabla con filtro custom
export async function updateRowByFilter<T extends object, R = T>(
  table: string,
  filter: string,
  patch: T,
): Promise<R[]> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      ...getHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Error actualizando en ${table}`);
  }

  return res.json();
}

// Eliminar registros de una tabla con filtro
export async function deleteRows(
  table: string,
  filter: string,
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || `Error eliminando en ${table}`);
  }
}
