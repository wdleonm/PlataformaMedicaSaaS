/**
 * Cliente HTTP para el backend. Añadir Authorization y manejo 401 en Fase 6.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const getApiUrl = () => API_URL;

export const api = {
  get: (path: string, options?: RequestInit) =>
    fetch(`${API_URL}${path}`, { ...options, method: "GET" }),
  post: (path: string, body?: unknown, options?: RequestInit) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (path: string, body?: unknown, options?: RequestInit) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (path: string, body?: unknown, options?: RequestInit) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (path: string, options?: RequestInit) =>
    fetch(`${API_URL}${path}`, { ...options, method: "DELETE" }),
};
