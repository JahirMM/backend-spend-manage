import { getUserById, selectRows, updateRow, deleteRows } from "@/lib/supabase";
import { successResponse, errorResponse, ERRORS } from "@/lib/response";
import { insertLog } from "@/app/hooks/insertBitacora";
import { Expense } from "@/app/interfaces/Expense.interface";
import { parseCurrency } from "@/lib/currency";

const URL_SERVICE = "/api/expenses/remove-account";
const SERVICE_NAME = "expenses-remove-account";

// PATCH /api/expenses/remove-account
// Quita la cuenta asociada a un gasto. Recibe: user_id, expense_id
export async function PATCH(request: Request) {
  let body;

  try {
    try {
      body = await request.json();
    } catch {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "PATCH",
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
    const expense_id = body.expense_id?.toString().trim();

    if (!user_id || !expense_id) {
      const mensaje = `${ERRORS.CAMPOS_REQUERIDOS}: user_id, expense_id. Recibido: ${JSON.stringify(body)}`;

      await insertLog({
        url_service: URL_SERVICE,
        http_method: "PATCH",
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
        http_method: "PATCH",
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
        http_method: "PATCH",
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

    // Verificar que el gasto existe y pertenece al usuario
    let expenses: Expense[];
    try {
      expenses = await selectRows<Expense[]>(
        "expenses",
        `select=id,user_id,commerce,count,name,account_id,created_at&id=eq.${expense_id}`,
      );
    } catch {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "PATCH",
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

    if (!expenses || expenses.length === 0) {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "PATCH",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.GASTO_NO_ENCONTRADO,
          data: null,
        },
        http_code: "404",
        error_message: ERRORS.GASTO_NO_ENCONTRADO,
      });

      return errorResponse(ERRORS.GASTO_NO_ENCONTRADO, 404);
    }

    if (expenses[0].user_id !== user_id) {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "PATCH",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.GASTO_NO_PERTENECE,
          data: null,
        },
        http_code: "403",
        error_message: ERRORS.GASTO_NO_PERTENECE,
      });

      return errorResponse(ERRORS.GASTO_NO_PERTENECE, 403);
    }

    // Quitar la cuenta asociada (poner account_id en null)
    let updated: Expense;
    try {
      updated = await updateRow<object, Expense>("expenses", expense_id, {
        account_id: null,
      });
    } catch {
      await insertLog({
        url_service: URL_SERVICE,
        http_method: "PATCH",
        service_name: SERVICE_NAME,
        payload_request: body,
        payload_response: {
          status: 0,
          mensaje_error: ERRORS.ERROR_ACTUALIZANDO_GASTO,
          data: null,
        },
        http_code: "500",
        error_message: ERRORS.ERROR_ACTUALIZANDO_GASTO,
      });

      return errorResponse(ERRORS.ERROR_ACTUALIZANDO_GASTO, 500);
    }

    const { user_id: _uid, ...expenseRaw } = updated;
    void _uid;
    const expense = { ...expenseRaw, count: parseCurrency(updated.count) };

    // Eliminar la transacción asociada en account_transactions
    const originalExpense = expenses[0];
    if (originalExpense.account_id) {
      try {
        const txDate = originalExpense.created_at.replace(/\+/g, "%2B");
        await deleteRows(
          "account_transactions",
          `account_id=eq.${originalExpense.account_id}&title=eq.${originalExpense.name}&transaction_date=eq.${txDate}`,
        );
      } catch {
        console.error("Error eliminando account_transaction para gasto:", expense_id);
      }
    }

    await insertLog({
      url_service: URL_SERVICE,
      http_method: "PATCH",
      service_name: SERVICE_NAME,
      payload_request: body,
      payload_response: {
        status: 1,
        mensaje_error: null,
        data: expense,
      },
      http_code: "200",
      error_message: "",
    });

    return successResponse(expense);
  } catch {
    await insertLog({
      url_service: URL_SERVICE,
      http_method: "PATCH",
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
