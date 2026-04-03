import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLocalDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  // Para 'YYYY-MM-DD', forzamos la hora local añadiendo mediodía
  // Esto evita desfases de zona horaria al formatear para visualización
  if (dateStr.includes('-') && !dateStr.includes('T')) {
    return new Date(dateStr + 'T12:00:00');
  }
  return new Date(dateStr);
}
