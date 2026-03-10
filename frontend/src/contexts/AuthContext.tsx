"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type UsoUsuario = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidad_principal: string | null;
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
      setUsuario(data);
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
