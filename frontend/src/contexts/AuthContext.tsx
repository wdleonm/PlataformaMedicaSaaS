"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Especialidad {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
}

type UsoUsuario = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidades: Especialidad[];
  /** Primera especialidad activa del especialista (shortcut) */
  especialidad_principal: Especialidad | null;
  slug_url: string | null;
  descripcion_perfil: string | null;
  redes_sociales: any | null;
  horario_atencion: any | null;
  clinica_nombre: string | null;
  clinica_logo_url: string | null;
  clinica_direccion: string | null;
  portal_visible: boolean;
  exigir_cambio_password: boolean;
  intervalo_cambio_password: number | null;
};

type AuthContextType = {
  usuario: UsoUsuario | null;
  token: string | null;
  isLoading: boolean;
  login: (access_token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsoUsuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Al cargar, verificar si hay un token
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUsuario(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUsuario = async (currentToken: string) => {
    try {
      // Configuramos el header manual por si el interceptor aún no lo caza
      const { data } = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      // Normalizar: extraer especialidad_principal desde el array de especialidades
      const especialidades: Especialidad[] = data.especialidades ?? [];
      const principal = especialidades.find((e) => e.activo) ?? especialidades[0] ?? null;

      setUsuario({
        id: data.id,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        especialidades,
        especialidad_principal: principal,
        slug_url: data.slug_url ?? null,
        descripcion_perfil: data.descripcion_perfil ?? null,
        redes_sociales: data.redes_sociales ?? null,
        horario_atencion: data.horario_atencion ?? null,
        clinica_nombre: data.clinica_nombre ?? null,
        clinica_logo_url: data.clinica_logo_url ?? null,
        clinica_direccion: data.clinica_direccion ?? null,
        portal_visible: data.portal_visible ?? false,
        exigir_cambio_password: data.exigir_cambio_password ?? false,
        intervalo_cambio_password: data.intervalo_cambio_password ?? 90,
      });
    } catch (error) {
      console.error("Error validando token:", error);
      logout(); // Token inválido o expirado
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (access_token: string) => {
    localStorage.setItem("token", access_token);
    setToken(access_token);
    await fetchUsuario(access_token);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ usuario, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
