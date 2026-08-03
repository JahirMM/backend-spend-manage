# Backend Spend Manage

Backend de gestión de gastos construido con Next.js (API Routes) y Supabase. Diseñado para ser consumido desde la app Atajos de iPhone (automatización de Wallet).

## URL Base

```
https://backend-spend-manage.vercel.app
```

## Estructura de Respuesta

Todas las respuestas siguen esta estructura:

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": {}
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| status | `0` o `1` | 1 = éxito, 0 = error |
| mensaje_error | `string` o `null` | Mensaje descriptivo del error, null si fue exitoso |
| data | `object`, `array` o `null` | Datos de respuesta, null si hubo error |

---

## Servicios

### POST /api/expenses

Crea un nuevo gasto asociado a un usuario por su email (flujo legacy).

**Headers:**

```
Content-Type: application/json
```

**Request:**

```json
{
  "email": "usuario@email.com",
  "commerce": "Walmart",
  "count": 150.50,
  "name": "Compras del super"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| email | string | sí | Email del usuario registrado en Supabase |
| commerce | string | sí | Nombre del comercio |
| count | number | sí | Monto del gasto (acepta string numérico) |
| name | string | sí | Descripción del gasto |

**Response exitosa (201):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "commerce": "Walmart",
    "count": 150.50,
    "name": "Compras del super",
    "account_id": null,
    "created_at": "2025-07-30T12:00:00.000Z"
  }
}
```

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 400 | Faltan campos requeridos |
| 400 | El cuerpo de la solicitud no es un JSON válido |
| 404 | No se encontró un usuario con ese email |
| 500 | Error al buscar el usuario |
| 500 | Error al crear el gasto |

---

### GET /api/expenses

Obtiene todos los gastos ordenados por fecha (más recientes primero).

**Request:**

```
GET /api/expenses
```

**Response exitosa (200):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "commerce": "Walmart",
      "count": 150.50,
      "name": "Compras del super",
      "account_id": null,
      "created_at": "2025-07-30T12:00:00.000Z"
    }
  ]
}
```

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 500 | Error al obtener los gastos |

---

### POST /api/expenses/by-date

Obtiene todos los gastos de un usuario en un mes completo. El `user_id`, `month` y `year` se envían en el body.

**Headers:**

```
Content-Type: application/json
```

**Request:**

```json
{
  "user_id": "uuid-del-usuario",
  "month": 7,
  "year": 2025
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| user_id | string (UUID) | sí | ID del usuario en Supabase |
| month | number | sí | Mes (1-12) |
| year | number | sí | Año (ej. 2025) |

**Response exitosa (200):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "commerce": "Walmart",
      "count": 1150,
      "name": "Compras del super",
      "account_id": null,
      "created_at": "2025-07-30T12:00:00.000Z"
    }
  ]
}
```

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 400 | Faltan campos requeridos |
| 400 | El cuerpo de la solicitud no es un JSON válido |
| 404 | No se encontró un usuario con ese email |
| 500 | Error al buscar el usuario |
| 500 | Error al obtener los gastos |

---

### POST /api/expenses/monthly-total

Suma el total gastado en un mes por un usuario. El `user_id`, `month` y `year` se envían en el body.

**Headers:**

```
Content-Type: application/json
```

**Request:**

```json
{
  "user_id": "uuid-del-usuario",
  "month": 7,
  "year": 2025
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| user_id | string (UUID) | sí | ID del usuario en Supabase |
| month | number | sí | Mes (1-12) |
| year | number | sí | Año (ej. 2025) |

**Response exitosa (200):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": {
    "user_email": "usuario@email.com",
    "month": 7,
    "year": 2025,
    "total": 1250.75,
    "expenses_count": 8
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| user_email | string | Email del usuario |
| month | number | Mes consultado |
| year | number | Año consultado |
| total | number | Suma total de gastos del mes |
| expenses_count | number | Cantidad de gastos en el mes |

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 400 | Faltan campos requeridos |
| 400 | El cuerpo de la solicitud no es un JSON válido |
| 404 | No se encontró un usuario con ese email |
| 500 | Error al buscar el usuario |
| 500 | Error al obtener los gastos |

---

### POST /api/expenses/create

Crea un nuevo gasto. El campo `day` se usa como fecha de creación (`created_at`) del gasto.

**Headers:**

```
Content-Type: application/json
```

**Request:**

```json
{
  "user_id": "uuid-del-usuario",
  "commerce": "Walmart",
  "count": 1150,
  "name": "Compras del super",
  "day": "30-07-2025",
  "account_id": "uuid-de-la-cuenta"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| user_id | string (UUID) | sí | ID del usuario en Supabase |
| commerce | string | sí | Nombre del comercio |
| count | number | sí | Monto del gasto (entero, ej. 1150) |
| name | string | sí | Descripción del gasto |
| day | string | sí | Fecha del gasto en formato `DD-MM-YYYY` (se guarda como `created_at`) |
| account_id | string (UUID) | no | ID de la cuenta asociada (puede ser null) |

**Response exitosa (201):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "commerce": "Walmart",
    "count": 1150,
    "name": "Compras del super",
    "account_id": "uuid-de-la-cuenta",
    "created_at": "2025-07-30T12:00:00.000Z"
  }
}
```

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 400 | Faltan campos requeridos |
| 400 | El cuerpo de la solicitud no es un JSON válido |
| 400 | El campo day debe tener formato DD-MM-YYYY |
| 404 | No se encontró un usuario con ese email |
| 500 | Error al buscar el usuario |
| 500 | Error al crear el gasto |

---

### PATCH /api/expenses/assign-account

Asocia una cuenta a un gasto existente.

**Headers:**

```
Content-Type: application/json
```

**Request:**

```json
{
  "user_id": "uuid-del-usuario",
  "expense_id": "uuid-del-gasto",
  "account_id": "uuid-de-la-cuenta"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| user_id | string (UUID) | sí | ID del usuario en Supabase |
| expense_id | string (UUID) | sí | ID del gasto a actualizar |
| account_id | string (UUID) | sí | ID de la cuenta a asociar |

**Response exitosa (200):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": {
    "id": "uuid-del-gasto",
    "commerce": "Walmart",
    "count": 150.50,
    "name": "Compras del super",
    "account_id": "uuid-de-la-cuenta",
    "created_at": "2025-07-30T12:00:00.000Z"
  }
}
```

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 400 | Faltan campos requeridos |
| 400 | El cuerpo de la solicitud no es un JSON válido |
| 403 | El gasto no pertenece al usuario |
| 404 | No se encontró un usuario con ese email |
| 404 | No se encontró el gasto |
| 500 | Error al buscar el usuario |
| 500 | Error al obtener los gastos |
| 500 | Error al actualizar el gasto |

---

### PATCH /api/expenses/edit

Edita el nombre y/o monto de un gasto existente. Se puede enviar `name`, `count` o ambos.

**Headers:**

```
Content-Type: application/json
```

**Request:**

```json
{
  "user_id": "uuid-del-usuario",
  "expense_id": "uuid-del-gasto",
  "name": "Nuevo nombre del gasto",
  "count": 2500
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| user_id | string (UUID) | sí | ID del usuario en Supabase |
| expense_id | string (UUID) | sí | ID del gasto a editar |
| name | string | no* | Nueva descripción/nombre del gasto |
| count | number | no* | Nuevo monto del gasto (entero, ej. 2500) |

> *Al menos uno de `name` o `count` debe enviarse.

**Response exitosa (200):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": {
    "id": "uuid-del-gasto",
    "commerce": "Walmart",
    "count": 2500,
    "name": "Nuevo nombre",
    "account_id": "uuid-o-null",
    "created_at": "2025-07-30T12:00:00.000Z"
  }
}
```

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 400 | Faltan campos requeridos |
| 400 | Se requiere al menos uno de: name, count |
| 400 | El cuerpo de la solicitud no es un JSON válido |
| 403 | El gasto no pertenece al usuario |
| 404 | No se encontró el gasto |
| 500 | Error al actualizar el gasto |

**Nota:** Si el gasto tiene una cuenta asociada, los cambios se sincronizan automáticamente con `account_transactions` (actualiza `title` y/o `principal_amount`/`total_amount`).

---

### PATCH /api/expenses/remove-account

Quita la cuenta asociada a un gasto (establece `account_id` en `null`).

**Headers:**

```
Content-Type: application/json
```

**Request:**

```json
{
  "user_id": "uuid-del-usuario",
  "expense_id": "uuid-del-gasto"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| user_id | string (UUID) | sí | ID del usuario en Supabase |
| expense_id | string (UUID) | sí | ID del gasto a actualizar |

**Response exitosa (200):**

```json
{
  "status": 1,
  "mensaje_error": null,
  "data": {
    "id": "uuid-del-gasto",
    "commerce": "Walmart",
    "count": 150.50,
    "name": "Compras del super",
    "account_id": null,
    "created_at": "2025-07-30T12:00:00.000Z"
  }
}
```

**Errores posibles:**

| HTTP | mensaje_error |
|------|---------------|
| 400 | Faltan campos requeridos |
| 400 | El cuerpo de la solicitud no es un JSON válido |
| 403 | El gasto no pertenece al usuario |
| 404 | No se encontró un usuario con ese email |
| 404 | No se encontró el gasto |
| 500 | Error al buscar el usuario |
| 500 | Error al obtener los gastos |
| 500 | Error al actualizar el gasto |

---

## Ejemplo de respuesta con error

```json
{
  "status": 0,
  "mensaje_error": "Faltan campos requeridos",
  "data": null
}
```

---

## Notas técnicas

- El campo `count` se almacena en la BD como string con formato de moneda: `$1.150` (prefijo `$` + separador de miles con `.`)
- Al **recibir** `count` en los servicios de creación, se espera un número (ej. `1150`); se formatea a `$1.150` internamente antes de guardarlo
- Al **retornar** gastos, `count` se convierte de `$1.150` a número entero (ej. `1150`)
- La utilidad de conversión vive en `lib/currency.ts` (`formatCurrency`, `parseCurrency`, `parseExpenseCount`)
- Los strings se limpian de espacios extra (trim)
- El campo `account_id` en la tabla `expenses` es opcional (puede ser `null`)
- Los servicios que reciben `user_id` consultan `auth.users` para verificar que el usuario existe
- **Sincronización con `account_transactions`:**
  - Al crear un gasto con `account_id`, se inserta automáticamente un registro en `account_transactions` con: `title` = name, `description` = commerce, `principal_amount` y `total_amount` = count, `transaction_date` = created_at del gasto, `installment_count` = 1, `is_active` = true
  - Al asociar una cuenta (`assign-account`), si ya existe una transacción para ese gasto se actualiza su `account_id`; si no existe, se crea una nueva
  - Al quitar una cuenta (`remove-account`), se elimina la transacción asociada de `account_transactions`
- Compatible con la app Atajos de iPhone para automatizaciones de Wallet

---

## Variables de Entorno

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```
