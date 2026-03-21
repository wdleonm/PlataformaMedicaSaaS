"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import SessionWarningModal from "@/components/SessionWarningModal";

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

// ─── Tiempos de inactividad ───────────────────────────────────────────────────
const INACTIVITY_WARNING_MS = 55 * 60 * 1000;  // 55 minutos → mostrar aviso
const WARNING_DURATION_S    = 5 * 60;           // 5 minutos de cuenta regresiva

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsoUsuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ─── Inactivity state ───────────────────────────────────────────────────────
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_DURATION_S);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const logout = useCallback((sessionExpired: boolean = false) => {
    // Limpiar timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);

    // Marcar si se cerró por expiración para mostrar mensaje en login
    if (sessionExpired) {
      sessionStorage.setItem("session_expired", "1");
    }

    localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
    router.push("/");
  }, [router]);

  // ─── Inactivity Timer Logic ─────────────────────────────────────────────────

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true);
    setSecondsLeft(WARNING_DURATION_S);

    // Limpiar countdown previo si existe
    if (countdownRef.current) clearInterval(countdownRef.current);

    let remaining = WARNING_DURATION_S;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        // Tiempo agotado → cerrar sesión por inactividad
        logout(true);
      }
    }, 1000);
  }, [logout]);

  const resetInactivityTimer = useCallback(() => {
    // Si ya se está mostrando el warning, no reseteamos (solo el botón "Continuar" lo hace)
    if (showWarning) return;

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, INACTIVITY_WARNING_MS);
  }, [showWarning, startWarningCountdown]);

  const handleContinueSession = useCallback(async () => {
    // Cerrar modal y countdown
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
    setSecondsLeft(WARNING_DURATION_S);

    // Probar que el token aún sea válido haciendo una llamada ligera
    try {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        await api.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
      }
    } catch {
      // Token ya expirado → se disparará el 401 handler
      return;
    }

    // Reiniciar timer de inactividad
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, INACTIVITY_WARNING_MS);
  }, [startWarningCountdown]);

  // ─── Registrar listeners de actividad ───────────────────────────────────────
  useEffect(() => {
    // Solo activar si el usuario está autenticado
    if (!token) return;

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];

    // Throttle: max 1 reset cada 30s para no sobrecargar
    let lastReset = Date.now();
    const handleActivity = () => {
      if (showWarning) return;           // Ignora si el modal ya está visible
      if (Date.now() - lastReset < 30_000) return;
      lastReset = Date.now();
      resetInactivityTimer();
    };

    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    // Iniciar el timer
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [token, showWarning, resetInactivityTimer]);

  // ─── Escuchar evento session-expired (emitido por api.ts interceptor) ───────
  useEffect(() => {
    const handleSessionExpired = () => {
      logout(true);
    };
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ usuario, token, isLoading, login, logout }}>
      {children}
      <SessionWarningModal
        isOpen={showWarning}
        secondsLeft={secondsLeft}
        onContinue={handleContinueSession}
        onLogout={logout}
      />
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
