import { getUserById, selectRows, updateRow, insertRow, updateRowByFilter } from "@/lib/supabase";
import { successResponse, errorResponse, ERRORS } from "@/lib/response";
import { insertLog } from "@/app/hooks/insertBitacora";
import { Expense } from "@/app/interfaces/Expense.interface";
import { parseCurrency } from "@/lib/currency";

const URL_SERVICE = "/api/expenses/assign-account";
const SERVICE_NAME = "expenses-assign-account";

// PATCH /api/expenses/assign-account
// Asocia una cuenta a un gasto existente. Recibe: user_id, expense_id, account_id
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
    const account_id = body.account_id?.toString().trim();

    if (!user_id || !expense_id || !account_id) {
      const mensaje = `${ERRORS.CAMPOS_REQUERIDOS}: user_id, expense_id, account_id. Recibido: ${JSON.stringify(body)}`;

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

    // Actualizar el gasto con la cuenta asociada
    let updated: Expense;
    try {
      updated = await updateRow<object, Expense>("expenses", expense_id, {
        account_id,
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

    // Crear o actualizar registro en account_transactions
    try {
      console.log("[assign-account] Intentando gestionar account_transaction...");
      console.log("[assign-account] Gasto actualizado:", JSON.stringify({
        id: updated.id,
        name: updated.name,
        commerce: updated.commerce,
        count: updated.count,
        created_at: updated.created_at,
        account_id: updated.account_id,
      }));

      // Buscar si ya existe una transacción para este gasto
      const txDate = updated.created_at.replace(/\+/g, "%2B");
      const searchFilter = `select=id&title=eq.${updated.name}&description=eq.${updated.commerce}&transaction_date=eq.${txDate}`;
      console.log("[assign-account] Buscando transacción existente con filtro:", searchFilter);

      const existingTx = await selectRows<{ id: string }[]>(
        "account_transactions",
        searchFilter,
      );

      console.log("[assign-account] Transacciones encontradas:", JSON.stringify(existingTx));

      if (existingTx && existingTx.length > 0) {
        // Actualizar account_id de la transacción existente
        console.log("[assign-account] Actualizando transacción existente:", existingTx[0].id);
        await updateRowByFilter(
          "account_transactions",
          `id=eq.${existingTx[0].id}`,
          { account_id },
        );
        console.log("[assign-account] Transacción actualizada OK");
      } else {
        // Crear nueva transacción
        const txData = {
          account_id,
          title: updated.name,
          description: updated.commerce,
          principal_amount: parseCurrency(updated.count),
          total_amount: parseCurrency(updated.count),
          transaction_date: updated.created_at,
          installment_count: 1,
          is_active: true,
        };
        console.log("[assign-account] Creando nueva transacción:", JSON.stringify(txData));
        await insertRow("account_transactions", txData);
        console.log("[assign-account] Transacción creada OK");
      }
    } catch (err) {
      console.error("[assign-account] Error gestionando account_transaction:", err instanceof Error ? err.message : String(err));
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
