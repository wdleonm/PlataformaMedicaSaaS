"use client";

import { useState } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Calendar,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const { loginAdmin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.post("/api/admin/auth/login", { email, password });
      await loginAdmin(data.access_token);
    } catch (err: any) {
      console.error("Login admin error:", err);
      setError(err.response?.data?.detail || "Error al autenticar administrador. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0514] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* --- CINTILLO SUPERIOR (ADMIN STYLE) --- */}
      <div className="fixed top-0 w-full z-[60] bg-violet-950/20 backdrop-blur-md border-b border-white/5 py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] text-violet-400/60 font-black uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-violet-500" /> +58 0412-4444621
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 text-violet-500" /> smartlift1608@gmail.com
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-violet-500" /> Valencia, Edo. Carabobo
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-6">
              <Calendar className="w-3 h-3 text-violet-500" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-28 h-28 bg-white/5 backdrop-blur-xl rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/20 ring-1 ring-white/10 overflow-hidden group hover:scale-105 transition-transform duration-500">
            <img 
              src="/img/logo/isotipo.png" 
              alt="VitalNexus Admin" 
              className="w-full h-full object-cover p-2"
            />
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">Master Admin</h1>
          <p className="text-violet-400 font-bold uppercase tracking-[0.2em] text-[11px] opacity-80">Portal Propietario VitalNexus</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-400 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Email Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full bg-[#0a0514]/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Contraseña Maestra</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0514]/40 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors rounded-lg"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-violet-900/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group tracking-tight"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verificando credenciales...
                </>
              ) : (
                <>
                  Ingresar al Centro de Control
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-500 text-xs">
          Acceso restringido únicamente a personal autorizado de <strong>VitalNexus SaaS</strong>.
          <br />Se registran todos los intentos de acceso por IP.
        </p>
      </motion.div>
    </div>
  );
}
