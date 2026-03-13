"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SeguridadPage() {
  const { usuario } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // States for security settings
  const [exigirCambio, setExigirCambio] = useState(false);
  const [intervalo, setIntervalo] = useState(90);

  useEffect(() => {
    if (usuario) {
      setExigirCambio(usuario.exigir_cambio_password);
      setIntervalo(usuario.intervalo_cambio_password || 90);
    }
  }, [usuario]);

  // Cálculo de fortaleza de contraseña
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return "";
    if (strength <= 1) return "Débil";
    if (strength === 2) return "Media";
    if (strength === 3) return "Buena";
    return "Excelente";
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Las contraseñas no coinciden" });
      return;
    }
    if (strength < 2) {
      setMessage({ type: 'error', text: "La nueva contraseña es muy débil" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await api.post("/api/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      setMessage({ type: 'success', text: "Contraseña actualizada exitosamente" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || "Error al cambiar la contraseña" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSecuritySettings = async () => {
    setIsUpdatingSettings(true);
    try {
      await api.patch("/api/auth/security-settings", {
        exigir_cambio_password: exigirCambio,
        intervalo_cambio_password: exigirCambio ? intervalo : null
      });
      alert("Preferencias de seguridad actualizadas");
    } catch (err: any) {
      alert("Error al actualizar preferencias: " + (err.response?.data?.detail || "Intente de nuevo"));
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12 p-2 lg:p-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-xl border border-primary/20 backdrop-blur-sm">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Seguridad Clínica</h1>
          <p className="text-primary font-black uppercase tracking-[0.2em] text-[9px] mt-0.5 opacity-90">Protección y Gestión de Accesos</p>
        </div>
      </div>

      {/* Grid Principal - Sección Superior */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Columna Izquierda: Formulario (8 cols) */}
        <div className="lg:col-span-8 h-full">
          <div className="glass-panel p-8 rounded-[36px] border border-border/50 shadow-xl bg-card/40 backdrop-blur-2xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <h3 className="text-lg font-black mb-8 italic tracking-tight flex items-center gap-3 text-foreground">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                <Lock size={16} />
              </div>
              Cambio de Contraseña
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-[20px] flex items-center gap-4 border ${
                      message.type === 'success' 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                      : 'bg-red-500/15 border-red-500/30 text-red-100'
                    } text-xs font-black shadow-lg shadow-black/20`}
                  >
                    <div className={message.type === 'success' ? 'p-1.5 bg-emerald-500/30 rounded-full' : 'p-1.5 bg-red-500/30 rounded-full'}>
                      {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    </div>
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 ml-2 group-focus-within:text-primary transition-all">Contraseña Actual</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors">
                      <Lock size={16} />
                    </div>
                    <input 
                      type={showPasswords ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-secondary/30 border border-white/5 rounded-[22px] p-4.5 pl-14 pr-12 focus:ring-4 focus:ring-primary/15 focus:border-primary/30 outline-none transition-all font-bold placeholder:text-foreground/20 text-foreground text-sm"
                      placeholder="Actual"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 ml-2 group-focus-within:text-primary transition-all">Repetir Nueva</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors">
                      <Lock size={16} />
                    </div>
                    <input 
                      type={showPasswords ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-secondary/30 border border-white/5 rounded-[22px] p-4.5 pl-14 outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary/30 transition-all font-bold placeholder:text-foreground/20 text-foreground text-sm"
                      placeholder="Confirmar"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2 group relative">
                   <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 ml-2 group-focus-within:text-primary transition-all">Nueva Contraseña</label>
                   <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors">
                      <Lock size={16} />
                    </div>
                    <input 
                      type={showPasswords ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-secondary/30 border border-white/5 rounded-[22px] p-4.5 pl-14 pr-14 focus:ring-4 focus:ring-primary/15 focus:border-primary/30 outline-none transition-all font-bold placeholder:text-foreground/20 text-foreground text-sm"
                      placeholder="8+ Caracteres"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-primary transition-colors p-2"
                    >
                      {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Fortaleza Visual Compacta */}
                  <AnimatePresence>
                    {newPassword && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-4 p-4 bg-black/20 rounded-[24px] border border-white/5"
                        >
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[9px] font-black uppercase text-foreground/60 tracking-[0.1em]">Fortaleza:</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                   strength <= 1 ? 'bg-red-500/20 text-red-500' : strength <= 3 ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                                }`}>
                                  {getStrengthLabel()}
                                </span>
                            </div>
                            <div className="flex gap-1.5 h-1.5 px-1">
                                {[1, 2, 3, 4].map((i) => (
                                    <div 
                                        key={i} 
                                        className={`flex-1 rounded-full transition-all duration-700 ${
                                            i <= strength 
                                            ? (strength <= 1 ? 'bg-red-500 shadow-red-500/20' : strength <= 3 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20')
                                            : 'bg-white/10'
                                        }`} 
                                    />
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 mt-4">
                               {[
                                 { check: newPassword.length >= 8, label: '8+' },
                                 { check: /[A-Z]/.test(newPassword), label: 'ABC' },
                                 { check: /[0-9]/.test(newPassword), label: '123' },
                                 { check: /[^A-Za-z0-9]/.test(newPassword), label: '@#$' }
                               ].map((cond, i) => (
                                 <div key={i} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${cond.check ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-black/10 border-white/5 text-foreground/30'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${cond.check ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-current opacity-20'}`} />
                                    <span className="text-[8px] font-black uppercase tracking-tighter">{cond.label}</span>
                                 </div>
                               ))}
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary/90 to-primary text-white font-black py-5 rounded-[22px] shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group tracking-[0.1em] uppercase text-[11px] mt-2 border border-white/20"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                    Actualizar Contraseña
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Reglas de Oro (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <div className="glass-panel p-8 rounded-[36px] border border-border/50 bg-secondary/10 h-full flex flex-col relative overflow-hidden group">
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-[60px]" />
            
            <h2 className="text-sm font-black mb-6 flex items-center gap-3 tracking-tight italic text-foreground relative z-10 uppercase">
               <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-lg border border-primary/20">
                 <Clock size={16} />
               </div>
               Reglas de Oro
            </h2>
            
            <div className="space-y-4 relative z-10 flex-1">
              <p className="text-[11px] text-foreground/80 font-bold leading-relaxed px-1">
                Blindar el acceso es tu mayor compromiso ético profesional.
              </p>
              
              <div className="space-y-3">
                {[
                  { text: "Sin nombres de familiares.", icon: "❌" },
                  { text: "Usa símbolos especiales.", icon: "💎" },
                  { text: "Renueva cada 90 días.", icon: "🔄" },
                  { text: "No la anotes en papel.", icon: "🙈" }
                ].map((tip, idx) => (
                  <motion.div 
                    key={idx}
                    className="p-3 bg-black/20 rounded-2xl border border-white/5 flex gap-3 items-center group/tip hover:bg-black/40 transition-all"
                  >
                     <span className="text-sm">{tip.icon}</span>
                     <span className="text-[10px] font-black uppercase tracking-wider text-foreground/90">{tip.text}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-primary/10 rounded-[20px] border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[9px] font-black text-foreground uppercase tracking-widest">Encriptación Activa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Renovación Automática - MAS COMPACTA Y SIN BOTON GRANDE */}
      <div className="animate-slide-up">
        <div className="glass-panel p-6 rounded-[40px] border border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] opacity-40 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5 w-full lg:w-auto">
                <div className="w-12 min-w-[3rem] h-12 bg-primary/30 rounded-2xl flex items-center justify-center text-primary shadow-xl border border-primary/20">
                  <Settings2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tighter text-foreground leading-none mb-1">
                    Caducidad Automática
                  </h2>
                  <p className="text-[11px] text-foreground/70 font-bold max-w-xs leading-tight">
                    Fuerza un cambio de clave periódico para máxima seguridad.
                  </p>
                </div>
            </div>
            
            <div className="flex-1 w-full flex flex-col md:flex-row items-center gap-4 bg-black/20 p-4 rounded-[28px] border border-white/5">
                {/* Switch Minimalista */}
                <div 
                  className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    exigirCambio ? 'bg-primary/20 border-primary/40 shadow-inner' : 'bg-white/5 border-white/10'
                  }`}
                  onClick={() => setExigirCambio(!exigirCambio)}
                >
                  <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${exigirCambio ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${exigirCambio ? 'left-5' : 'left-1'}`} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${exigirCambio ? 'text-foreground' : 'text-foreground/40'}`}>
                    {exigirCambio ? 'Activado' : 'Desactivado'}
                  </span>
                </div>

                {/* Selector */}
                <AnimatePresence>
                  {exigirCambio && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex-1"
                    >
                      <select 
                        value={intervalo}
                        onChange={(e) => setIntervalo(parseInt(e.target.value))}
                        className="w-full bg-[#070c0c] border border-primary/20 rounded-2xl p-4 text-[11px] font-black text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                      >
                        <option value={60}>60 Días (Seguro)</option>
                        <option value={90}>90 Días (Estándar)</option>
                        <option value={120}>120 Días</option>
                        <option value={180}>180 Días</option>
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={handleUpdateSecuritySettings}
                  disabled={isUpdatingSettings}
                  className="px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isUpdatingSettings ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Guardar
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
