"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Key, 
  Save, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminSeguridadPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-transparent", width: "w-0", text: "text-slate-500" };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    if (score < 2) return { label: "Débil", color: "bg-red-500", width: "w-1/3", text: "text-red-400" };
    if (score < 4) return { label: "Media", color: "bg-amber-500", width: "w-2/3", text: "text-amber-400" };
    return { label: "Fuerte", color: "bg-emerald-500", width: "w-full", text: "text-emerald-400" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      setError("La contraseña no cumple con los requisitos de seguridad (Mínimo 8 caracteres, mayúscula, número y símbolo).");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/api/admin/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccessMsg("¡Contraseña actualizada exitosamente!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      let errorDetail = err.response?.data?.detail;
      if (err.response?.status === 404) {
        errorDetail = "El servicio de cambio de contraseña no se encuentra (Por favor reinicia el servidor backend para aplicar los últimos cambios).";
      }
      
      setError(
        errorDetail || 
        "Error al cambiar la contraseña. Verifica tu contraseña actual."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-violet-500" size={32} />
          Seguridad de la Cuenta
        </h1>
        <p className="text-slate-400 mt-2 font-medium max-w-2xl text-sm leading-relaxed">
          Gestiona las credenciales de acceso para tu cuenta de Administrador Maestro. 
          Mantén tu contraseña segura y actualizada para proteger la integridad de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0514]/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/20 transition-all duration-500 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-[80px] group-hover:bg-violet-600/10 transition-colors pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Key className="text-violet-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white relative z-10">Cambiar Contraseña</h2>
              <p className="text-xs text-slate-400 font-medium">Actualiza tu clave de acceso maestro</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm font-medium text-red-400">{error}</p>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                  <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm font-medium text-emerald-400">{successMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Contraseña Actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Indicador de Fortaleza */}
              {newPassword && (
                <div className="space-y-1.5 px-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Nivel de seguridad:</span>
                    <span className={strength.text}>{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </motion.div>

        {/* Info panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/20 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="text-indigo-400" size={20} />
              Recomendaciones de Seguridad
            </h3>
            <ul className="space-y-4">
              {[
                "Usa al menos 8 caracteres para mayor seguridad.",
                "Combina letras mayúsculas, minúsculas y números.",
                "Usa al menos un símbolo especial (Ej: @, #, $, *, etc.).",
                "Evita usar la misma contraseña en otros sitios.",
                "No compartas tu clave de acceso maestro con el personal de soporte.",
              ].map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="text-indigo-400" size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-300 leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
