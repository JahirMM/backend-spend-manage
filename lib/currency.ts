/**
 * Formatea un número al formato de moneda usado en la BD: "$1.150"
 * El prefijo "$" indica que es una cantidad/precio, y el separador de miles es "."
 * Ejemplos: 1150 -> "$1.150", 200 -> "$200", 1234567 -> "$1.234.567"
 */
export function formatCurrency(value: number): string {
  const rounded = Math.round(value);
  const formatted = rounded.toLocaleString("de-DE"); // usa "." como separador de miles
  return `$${formatted}`;
}

/**
 * Parsea el formato de moneda de la BD ("$1.150") a número.
 * Elimina el prefijo "$" y los puntos de miles.
 * Ejemplos: "$1.150" -> 1150, "$200" -> 200, "$1.234.567" -> 1234567
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/^\$/, "").replace(/\./g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convierte un array de gastos reemplazando el campo count
 * del formato de moneda (string) a número.
 */
export function parseExpenseCount<T extends { count: string }>(
  expenses: T[],
): (Omit<T, "count"> & { count: number })[] {
  return expenses.map(({ count, ...rest }) => ({
    ...rest,
    count: parseCurrency(count),
  }));
}
