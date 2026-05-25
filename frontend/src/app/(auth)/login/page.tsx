"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Activity } from "lucide-react";

export default function LoginPage() {
  const { login, token, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Si ya tiene sesión, redirigir
  useEffect(() => {
    if (!isLoading && token) router.push("/dashboard");
  }, [token, isLoading, router]);

  // Detectar si vino por sesión expirada
  useEffect(() => {
    if (sessionStorage.getItem("session_expired") === "1") {
      setSessionExpired(true);
      sessionStorage.removeItem("session_expired");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      await login(data.access_token);
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      setError(msg || "Email o contraseña incorrectos. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080d14]">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-500/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/img/grid.svg')] opacity-[0.03]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 ring-1 ring-white/10"
          >
            <img src="/img/logo/isotipo.png" alt="VitalNexus" className="w-full h-full object-cover" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tighter">VitalNexus</h1>
            <p className="text-xs text-primary/60 font-bold uppercase tracking-widest">Plataforma Médica SaaS</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Sesión expirada */}
          <AnimatePresence>
            {sessionExpired && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-5 text-amber-400 text-sm"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-medium">Tu sesión expiró por inactividad. Inicia sesión de nuevo.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <h2 className="text-xl font-black text-white mb-1">Bienvenido de vuelta</h2>
          <p className="text-sm text-slate-400 mb-6">Ingresa a tu consultorio digital</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dr.ejemplo@correo.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/30 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Verificando...</>
              ) : (
                <><Activity size={16} /> Entrar al Sistema</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">o</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Registro */}
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-500">¿Aún no tienes cuenta?</p>
            <Link
              href="/register"
              className="block w-full py-3.5 rounded-2xl border border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary font-bold text-sm transition-all text-center"
            >
              🎁 Registrarse gratis — 30 días de prueba
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Al ingresar aceptas nuestros{" "}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer transition-colors">Términos de uso</span>
          {" "}y{" "}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer transition-colors">Política de privacidad</span>
        </p>
      </motion.div>
    </div>
  );
}
