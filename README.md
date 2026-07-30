# Backend Spend Manage

Backend de gestión de gastos construido con Next.js (API Routes) y Supabase.

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

Crea un nuevo gasto.

**Request:**

```json
{
  "email": "usuario@email.com",
  "commerce": "Walmart",
  "count": 150.50,
  "name": "Compras del super"
}
```

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

## Ejemplo de respuesta con error

```json
{
  "status": 0,
  "mensaje_error": "Faltan campos requeridos",
  "data": null
}
```

---

## Variables de Entorno

```
SUPABASE_URL=https://tu-proyecto-id.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```
