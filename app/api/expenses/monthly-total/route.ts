import { getUserById, selectRows } from "@/lib/supabase";
import { successResponse, errorResponse, ERRORS } from "@/lib/response";
import { insertLog } from "@/app/hooks/insertBitacora";
import { Expense } from "@/app/interfaces/Expense.interface";
import { parseCurrency } from "@/lib/currency";

const URL_SERVICE = "/api/expenses/monthly-total";
const SERVICE_NAME = "expenses-monthly-total";

// POST /api/expenses/monthly-total
// Suma el total gastado en un mes por un usuario (user_id, month, year en el body)
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

    const user_id = body.user_id?.toString().trim();
    const month = parseInt(body.month);
    const year = parseInt(body.year);

    if (!user_id || isNaN(month) || isNaN(year)) {
      const mensaje = `${ERRORS.CAMPOS_REQUERIDOS}: user_id, month, year. Recibido: ${JSON.stringify(body)}`;

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

    // Verificar que el usuario existe
    let user;
    try {
      user = await getUserById(user_id);
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

    // Calcular rango del mes completo
    const paddedMonth = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();
    const dateStart = `${year}-${paddedMonth}-01T00:00:00.000Z`;
    const dateEnd = `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`;

    let expenses: Expense[];
    try {
      expenses = await selectRows<Expense[]>(
        "expenses",
        `select=count&user_id=eq.${user_id}&created_at=gte.${dateStart}&created_at=lte.${dateEnd}`,
      );
    } catch {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "POST",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.ERROR_OBTENIENDO_GASTOS,
          data: null,
        },
        http_code: "500",
        error_message: ERRORS.ERROR_OBTENIENDO_GASTOS,
      });

      return errorResponse(ERRORS.ERROR_OBTENIENDO_GASTOS, 500);
    }

    const total = expenses.reduce((sum, expense) => sum + parseCurrency(expense.count), 0);

    const responseData = {
      user_email: user.email,
      month,
      year,
      total,
      expenses_count: expenses.length,
    };

    await insertLog({
      url_service: URL_SERVICE,
      http_method: "POST",
      service_name: SERVICE_NAME,
      payload_request: body,
      payload_response: {
        status: 1,
        mensaje_error: null,
        data: responseData,
      },
      http_code: "200",
      error_message: "",
    });

    return successResponse(responseData);
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
