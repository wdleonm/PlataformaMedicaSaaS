/**
 * Utilidad para combinar clases Tailwind. Añadir clsx + tailwind-merge cuando se instale Shadcn.
 */
export function cn(...inputs: (string | undefined | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
