import { getUserByEmail, insertRow, selectRows } from "@/lib/supabase";
import { successResponse, errorResponse, ERRORS } from "@/lib/response";

// POST /api/expenses - Crear un gasto
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ERRORS.BODY_INVALIDO, 400);
    }

    const { email, commerce, count, name } = body;

    if (!email || !commerce || !count || !name) {
      return errorResponse(ERRORS.CAMPOS_REQUERIDOS, 400);
    }

    // Buscar usuario por email en auth.users
    let user;
    try {
      user = await getUserByEmail(email);
    } catch {
      return errorResponse(ERRORS.ERROR_BUSCANDO_USUARIO, 500);
    }

    if (!user) {
      return errorResponse(ERRORS.USUARIO_NO_ENCONTRADO, 404);
    }

    // Insertar el gasto
    let data;
    try {
      data = await insertRow("expenses", {
        user_id: user.id,
        commerce,
        count,
        name,
      });
    } catch {
      return errorResponse(ERRORS.ERROR_CREANDO_GASTO, 500);
    }

    // Excluir user_id de la respuesta
    const { user_id, ...expense } = data;
    return successResponse(expense, 201);
  } catch {
    return errorResponse(ERRORS.ERROR_INTERNO, 500);
  }
}

// GET /api/expenses - Obtener todos los gastos
export async function GET() {
  try {
    const data = await selectRows(
      "expenses",
      "select=id,commerce,count,name,created_at&order=created_at.desc"
    );
    return successResponse(data);
  } catch {
    return errorResponse(ERRORS.ERROR_OBTENIENDO_GASTOS, 500);
  }
}
