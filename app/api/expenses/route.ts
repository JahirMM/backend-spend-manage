import { getUserByEmail, insertRow, selectRows } from "@/lib/supabase";
import { successResponse, errorResponse, ERRORS } from "@/lib/response";
import { insertLog } from "@/app/hooks/insertBitacora";

const URL_SERVICE = "/api/expenses";
const SERVICE_NAME = "expenses";

// POST /api/expenses - Crear un gasto
export async function POST(request: Request) {
  let body;

  try {
    try {
      body = await request.json();
    } catch {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "POST",
        service_name: SERVICE_NAME,
        payload_request: null,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.BODY_INVALIDO,
          data: null,
        },
        http_code: "400",
        error_message: ERRORS.BODY_INVALIDO,
      });

      return errorResponse(ERRORS.BODY_INVALIDO, 400);
    }

    const email = body.email?.toString().trim();
    const commerce = body.commerce?.toString().trim();
    const count = body.count?.toString().trim();
    const name = body.name?.toString().trim();

    if (!email || !commerce || !count || !name) {
      const mensaje = `${ERRORS.CAMPOS_REQUERIDOS}: email, commerce, count, name. Recibido: ${JSON.stringify(body)}`;

      await insertLog({
        url_service: URL_SERVICE,
        http_method: "POST",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: mensaje,
          data: null,
        },
        http_code: "400",
        error_message: mensaje,
      });

      return errorResponse(mensaje, 400);
    }

    // Buscar usuario por email
    let user;
    try {
      user = await getUserByEmail(email);
    } catch {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "POST",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.ERROR_BUSCANDO_USUARIO,
          data: null,
        },
        http_code: "500",
        error_message: ERRORS.ERROR_BUSCANDO_USUARIO,
      });

      return errorResponse(ERRORS.ERROR_BUSCANDO_USUARIO, 500);
    }

    if (!user) {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "POST",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.USUARIO_NO_ENCONTRADO,
          data: null,
        },
        http_code: "404",
        error_message: ERRORS.USUARIO_NO_ENCONTRADO,
      });

      return errorResponse(ERRORS.USUARIO_NO_ENCONTRADO, 404);
    }

    // Crear gasto
    let data;
    try {
      data = await insertRow("expenses", {
        user_id: user.id,
        commerce,
        count,
        name,
      });
    } catch {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "POST",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.ERROR_CREANDO_GASTO,
          data: null,
        },
        http_code: "500",
        error_message: ERRORS.ERROR_CREANDO_GASTO,
      });

      return errorResponse(ERRORS.ERROR_CREANDO_GASTO, 500);
    }

    // No devolver el user_id
    const { user_id, ...expense } = data;

    await insertLog({
      url_service: URL_SERVICE,
      http_method: "POST",
      service_name: SERVICE_NAME,
      payload_request: body,
      payload_response: {
        status: 1,
        mensaje_error: null,
        data: expense,
      },
      http_code: "201",
      error_message: "",
    });

    return successResponse(expense, 201);
  } catch {
    await insertLog({
      url_service: URL_SERVICE,
      http_method: "POST",
      service_name: SERVICE_NAME,
      payload_request: body ?? null,
      payload_response: {
        status: 0,
        mensaje_error: ERRORS.ERROR_INTERNO,
        data: null,
      },
      http_code: "500",
      error_message: ERRORS.ERROR_INTERNO,
    });

    return errorResponse(ERRORS.ERROR_INTERNO, 500);
  }
}

// GET /api/expenses - Obtener todos los gastos
export async function GET() {
  try {
    const data = await selectRows(
      "expenses",
      "select=id,commerce,count,name,created_at&order=created_at.desc",
    );
    return successResponse(data);
  } catch {
    return errorResponse(ERRORS.ERROR_OBTENIENDO_GASTOS, 500);
  }
}
