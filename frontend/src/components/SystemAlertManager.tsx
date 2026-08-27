"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface SystemStatus {
  alerta_mantenimiento_activa: boolean;
  alerta_mantenimiento_mensaje: string;
  version_minima_app: string;
}

// Para propósitos de este sistema, puedes definir la versión actual aquí 
// o en tu archivo .env.local (NEXT_PUBLIC_APP_VERSION).
const CURRENT_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

// Función simple para comparar versiones (ej. "1.0.1" > "1.0.0")
const isVersionOutdated = (current: string, minimum: string) => {
  const currParts = current.split(".").map(Number);
  const minParts = minimum.split(".").map(Number);
  
  for (let i = 0; i < Math.max(currParts.length, minParts.length); i++) {
    const curr = currParts[i] || 0;
    const min = minParts[i] || 0;
    if (curr < min) return true;
    if (curr > min) return false;
  }
  return false;
};

export default function SystemAlertManager() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isOutdated, setIsOutdated] = useState(false);

  const fetchStatus = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/public/system-status`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data: SystemStatus = await res.json();
        setStatus(data);
        
        // Verificar versión
        if (isVersionOutdated(CURRENT_APP_VERSION, data.version_minima_app)) {
          setIsOutdated(true);
        }
      }
    } catch (err) {
      console.error("No se pudo obtener el estado del sistema", err);
    }
  };

  useEffect(() => {
    // Buscar al cargar
    fetchStatus();

    // Buscar cada 30 segundos para mantener la app actualizada
    const interval = setInterval(fetchStatus, 30000);
    
    // Buscar cuando la pestaña vuelva a estar en foco
    const onFocus = () => fetchStatus();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  if (!status) return null;

  return (
    <>
      {/* 1. Banner de Mantenimiento (Visual) */}
      {status.alerta_mantenimiento_activa && !isOutdated && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 text-center shadow-md flex items-center justify-center gap-3 animate-in slide-in-from-top">
          <AlertTriangle size={18} className="animate-pulse" />
          <p className="font-bold text-sm">
            {status.alerta_mantenimiento_mensaje || "El sistema entrará en mantenimiento pronto."}
          </p>
        </div>
      )}

      {/* 2. Modal de Bloqueo por Actualización Obligatoria */}
      {isOutdated && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="text-violet-600 dark:text-violet-400" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
              Actualización Requerida
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Hemos lanzado una nueva versión del sistema con mejoras importantes. Para continuar trabajando, por favor recarga la página.
            </p>
            <button
              onClick={handleReload}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Recargar Aplicación
            </button>
            <p className="mt-4 text-xs text-slate-400">
              Versión requerida: {status.version_minima_app} | Actual: {CURRENT_APP_VERSION}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
