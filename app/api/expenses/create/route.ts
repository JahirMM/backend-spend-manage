import { getUserById, insertRow } from "@/lib/supabase";
import { successResponse, errorResponse, ERRORS } from "@/lib/response";
import { insertLog } from "@/app/hooks/insertBitacora";
import { Expense } from "@/app/interfaces/Expense.interface";
import { formatCurrency, parseCurrency } from "@/lib/currency";

const URL_SERVICE = "/api/expenses/create";
const SERVICE_NAME = "expenses-create";

// POST /api/expenses/create
// Crea un nuevo gasto. Recibe: user_id, commerce, count, name, day (DD-MM-YYYY), account_id (opcional)
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
    const commerce = body.commerce?.toString().trim();
    const count = body.count;
    const name = body.name?.toString().trim();
    const day = body.day?.toString().trim(); // formato: DD-MM-YYYY
    const account_id = body.account_id?.toString().trim() ?? null;

    if (!user_id || !commerce || count === undefined || count === null || !name || !day) {
      const mensaje = `${ERRORS.CAMPOS_REQUERIDOS}: user_id, commerce, count, name, day. Recibido: ${JSON.stringify(body)}`;

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

    // Parsear día en formato DD-MM-YYYY para usarlo como created_at
    const [dd, mm, yyyy] = day.split("-");
    const parsedDate = new Date(`${yyyy}-${mm}-${dd}T12:00:00.000Z`);
    if (isNaN(parsedDate.getTime())) {
      const mensaje = "El campo day debe tener formato DD-MM-YYYY";

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

    // Crear gasto (el day se usa como created_at)
    let data: Expense;
    try {
      data = await insertRow<object, Expense>("expenses", {
        user_id,
        commerce,
        count: formatCurrency(Number(count)), // guardar como "$1.800"
        name,
        account_id: account_id || null,
        created_at: parsedDate.toISOString(),
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

    // No devolver el user_id, y parsear count a número
    const { user_id: _uid, ...expenseRaw } = data;
    void _uid;
    const expense = { ...expenseRaw, count: parseCurrency(data.count) };

    // Si tiene cuenta asociada, crear registro en account_transactions
    if (account_id) {
      try {
        await insertRow("account_transactions", {
          account_id,
          title: name,
          description: commerce,
          principal_amount: Number(count),
          total_amount: Number(count),
          transaction_date: parsedDate.toISOString(),
          installment_count: 1,
          is_active: true,
        });
      } catch {
        // No bloquear la creación del gasto si falla la transacción
        console.error("Error creando account_transaction para gasto:", data.id);
      }
    }

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
