import { NextResponse } from "next/server";

interface ApiResponse {
  status: 0 | 1;
  mensaje_error: string | null;
  data: unknown;
}

// Respuesta exitosa
export function successResponse(data: unknown, httpStatus: number = 200) {
  const body: ApiResponse = {
    status: 1,
    mensaje_error: null,
    data,
  };
  return NextResponse.json(body, { status: httpStatus });
}

// Respuesta de error
export function errorResponse(mensaje: string, httpStatus: number = 500) {
  const body: ApiResponse = {
    status: 0,
    mensaje_error: mensaje,
    data: null,
  };
  return NextResponse.json(body, { status: httpStatus });
}

// Mensajes de error predefinidos
export const ERRORS = {
  CAMPOS_REQUERIDOS: "Faltan campos requeridos",
  USUARIO_NO_ENCONTRADO: "No se encontró un usuario con ese email",
  ERROR_BUSCANDO_USUARIO: "Error al buscar el usuario",
  ERROR_CREANDO_GASTO: "Error al crear el gasto",
  ERROR_OBTENIENDO_GASTOS: "Error al obtener los gastos",
  ERROR_ACTUALIZANDO_GASTO: "Error al actualizar el gasto",
  GASTO_NO_ENCONTRADO: "No se encontró el gasto",
  GASTO_NO_PERTENECE: "El gasto no pertenece al usuario",
  ERROR_INTERNO: "Error interno del servidor",
  METODO_NO_PERMITIDO: "Método no permitido",
  BODY_INVALIDO: "El cuerpo de la solicitud no es un JSON válido",
} as const;
 