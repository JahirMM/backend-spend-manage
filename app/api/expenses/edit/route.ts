import { getUserById, selectRows, updateRow, updateRowByFilter } from "@/lib/supabase";
import { successResponse, errorResponse, ERRORS } from "@/lib/response";
import { insertLog } from "@/app/hooks/insertBitacora";
import { Expense } from "@/app/interfaces/Expense.interface";
import { formatCurrency, parseCurrency } from "@/lib/currency";

const URL_SERVICE = "/api/expenses/edit";
const SERVICE_NAME = "expenses-edit";

// PATCH /api/expenses/edit
// Edita el nombre y/o monto de un gasto. Recibe: user_id, expense_id, name (opcional), count (opcional)
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
    const name = body.name?.toString().trim() || undefined;
    const count = body.count !== undefined && body.count !== null ? body.count : undefined;

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

    if (!name && count === undefined) {
      const mensaje = "Se requiere al menos uno de: name, count";

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

    // Construir objeto de actualización
    const patch: Record<string, string> = {};
    if (name) patch.name = name;
    if (count !== undefined) patch.count = formatCurrency(Number(count));

    // Actualizar el gasto
    let updated: Expense;
    try {
      updated = await updateRow<object, Expense>("expenses", expense_id, patch);
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

    // Si el gasto tiene cuenta asociada, sincronizar cambios en account_transactions
    if (updated.account_id) {
      try {
        const txDate = updated.created_at.replace(/\+/g, "%2B");
        const txPatch: Record<string, unknown> = {};
        if (name) txPatch.title = name;
        if (count !== undefined) {
          txPatch.principal_amount = Number(count);
          txPatch.total_amount = Number(count);
        }

        if (Object.keys(txPatch).length > 0) {
          await updateRowByFilter(
            "account_transactions",
            `account_id=eq.${updated.account_id}&transaction_date=eq.${txDate}`,
            txPatch,
          );
        }
      } catch (err) {
        console.error("[edit] Error sincronizando account_transactions:", err instanceof Error ? err.message : String(err));
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
