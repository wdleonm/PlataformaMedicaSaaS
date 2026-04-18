"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type AdminUser = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
};

type AdminAuthContextType = {
  admin: AdminUser | null;
  adminToken: string | null;
  isLoading: boolean;
  loginAdmin: (access_token: string) => Promise<void>;
  logoutAdmin: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    if (storedToken) {
      setAdminToken(storedToken);
      fetchAdmin(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleAdminSessionExpired = () => {
      logoutAdmin();
    };
    window.addEventListener("admin-session-expired", handleAdminSessionExpired);
    return () => window.removeEventListener("admin-session-expired", handleAdminSessionExpired);
  }, []);

  const fetchAdmin = async (currentToken: string) => {
    try {
      const { data } = await api.get("/api/admin/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setAdmin(data);
    } catch (error) {
      console.error("Error validando token de administrador:", error);
      logoutAdmin();
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdmin = async (access_token: string) => {
    localStorage.setItem("admin_token", access_token);
    setAdminToken(access_token);
    await fetchAdmin(access_token);
    router.push("/admin/dashboard");
  };

  const logoutAdmin = () => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
    setAdmin(null);
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider value={{ admin, adminToken, isLoading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth debe usarse dentro de un AdminAuthProvider");
  }
  return context;
}
