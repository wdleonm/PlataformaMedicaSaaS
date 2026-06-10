"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle,
  CheckCircle2, ChevronRight, ChevronLeft, Stethoscope,
  Gift, Shield, Zap, Star, ShieldAlert
} from "lucide-react";

// Dominio interno bloqueado para registro público
const BLOCKED_DOMAINS = ["vitalnexus.com"];

interface Especialidad {
  id: string;
  nombre: string;
  codigo: string;
}

// Validación de fortaleza de contraseña
function getPasswordStrength(pwd: string) {
  let score = 0;
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };
  score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

const STEPS = ["Datos", "Especialidad", "Contraseña", "Confirmación"];

export default function RegisterPage() {
  const { login, token, isLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loadingEsp, setLoadingEsp] = useState(true);

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Validación de dominio bloqueado
  const emailDomain = email.includes("@") ? email.split("@")[1]?.toLowerCase() : "";
  const isBlockedDomain = BLOCKED_DOMAINS.includes(emailDomain);

  const pwStrength = getPasswordStrength(password);

  // Si ya tiene sesión, redirigir
  useEffect(() => {
    if (!isLoading && token) router.push("/dashboard");
  }, [token, isLoading, router]);

  // Cargar especialidades disponibles
  useEffect(() => {
    api.get("/api/auth/especialidades")
      .then(r => setEspecialidades(r.data))
      .catch(() => setEspecialidades([]))
      .finally(() => setLoadingEsp(false));
  }, []);

  const toggleEspecialidad = (id: string) => {
    setEspecialidadesSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Validar cada paso antes de avanzar
  const canAdvance = () => {
    if (step === 0) return nombre.trim().length >= 2 && apellido.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && !isBlockedDomain;
    if (step === 1) return true; // Especialidad es opcional
    if (step === 2) return pwStrength.score >= 2 && password === confirmPassword && password.length >= 6;
    if (step === 3) return aceptaTerminos && !!turnstileToken;
    return false;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // 1. Registrar (incluye token CAPTCHA)
      await api.post("/api/auth/register", {
        email,
        password,
        nombre,
        apellido,
        especialidad_ids: especialidadesSeleccionadas,
        turnstile_token: turnstileToken,
      });
      // 2. Login automático
      const { data } = await api.post("/api/auth/login", { email, password });
      await login(data.access_token);
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      setError(msg || "Ocurrió un error al crear tu cuenta. Intenta con otro correo.");
      setTurnstileToken(null); // Reset CAPTCHA al haber error
      setStep(3);
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

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const strengthLabels = ["Muy débil", "Débil", "Regular", "Fuerte"];

  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/6 rounded-full blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 ring-1 ring-white/10">
            <img src="/img/logo/isotipo.png" alt="VitalNexus" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tighter">VitalNexus</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Gift size={13} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">30 días gratis — Plan Profesional</span>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all ${
                i < step ? "bg-emerald-500 text-white" :
                i === step ? "bg-primary text-white shadow-lg shadow-primary/40" :
                "bg-white/5 text-slate-600 border border-white/10"
              }`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full transition-all ${i < step ? "bg-emerald-500" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{STEPS[step]}</p>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <AnimatePresence mode="wait">

            {/* ── Paso 0: Datos personales ────────────────────────── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">¿Cómo te llamas?</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Estos datos aparecerán en tu perfil y portal público</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nombre", value: nombre, set: setNombre, placeholder: "Ej: Daniela" },
                    { label: "Apellido", value: apellido, set: setApellido, placeholder: "Ej: González" },
                  ].map(field => (
                    <div key={field.label} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                          value={field.value}
                          onChange={e => field.set(e.target.value)}
                          placeholder={field.placeholder}
                          required
                          className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="dr.ejemplo@correo.com"
                      required
                      autoComplete="email"
                      className={`w-full pl-9 pr-4 py-3 bg-white/5 border rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 transition-all text-sm ${
                        isBlockedDomain
                          ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20"
                          : "border-white/10 focus:border-primary/50 focus:ring-primary/20"
                      }`}
                    />
                  </div>
                  {isBlockedDomain ? (
                    <p className="text-xs text-red-400 flex items-center gap-1 pl-1">
                      <ShieldAlert size={12} /> El dominio @vitalnexus.com no está permitido para registro externo.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 pl-1">Este será tu usuario para iniciar sesión</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Paso 1: Especialidad ────────────────────────────── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Tu especialidad</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Selecciona una o más. Puedes cambiarlas después.</p>
                </div>
                {loadingEsp ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {especialidades.map(esp => {
                      const selected = especialidadesSeleccionadas.includes(esp.id);
                      return (
                        <button
                          key={esp.id}
                          type="button"
                          onClick={() => toggleEspecialidad(esp.id)}
                          className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all text-sm ${
                            selected
                              ? "bg-primary/10 border-primary/40 text-primary font-bold"
                              : "bg-white/3 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <Stethoscope size={14} className={selected ? "text-primary" : "text-slate-600"} />
                          <span className="leading-tight">{esp.nombre}</span>
                          {selected && <CheckCircle2 size={13} className="ml-auto text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-slate-600 italic">
                  {especialidadesSeleccionadas.length === 0
                    ? "Ninguna seleccionada — puedes agregarlas desde tu perfil luego"
                    : `${especialidadesSeleccionadas.length} especialidad(es) seleccionada(s)`}
                </p>
              </motion.div>
            )}

            {/* ── Paso 2: Contraseña ──────────────────────────────── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Crea tu contraseña</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Mínimo 6 caracteres. Más fuerte = más seguro.</p>
                </div>
                {/* Contraseña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Barra de fortaleza */}
                  {password && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < pwStrength.score ? strengthColors[pwStrength.score - 1] : "bg-white/10"}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-bold ${pwStrength.score >= 3 ? "text-emerald-400" : pwStrength.score >= 2 ? "text-yellow-400" : "text-red-400"}`}>
                        {strengthLabels[pwStrength.score - 1] || "Muy débil"}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {[
                          { ok: pwStrength.checks.length, label: "8+ caracteres" },
                          { ok: pwStrength.checks.uppercase, label: "Mayúscula" },
                          { ok: pwStrength.checks.number, label: "Número" },
                          { ok: pwStrength.checks.special, label: "Símbolo" },
                        ].map(({ ok, label }) => (
                          <div key={label} className={`flex items-center gap-1 ${ok ? "text-emerald-400" : "text-slate-600"}`}>
                            {ok ? <CheckCircle2 size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />}
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Confirmar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full pl-9 pr-10 py-3 bg-white/5 border rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 transition-all text-sm ${
                        confirmPassword && confirmPassword !== password
                          ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                          : confirmPassword && confirmPassword === password
                          ? "border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          : "border-white/10 focus:border-primary/50 focus:ring-primary/20"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} /> Las contraseñas no coinciden</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} /> Contraseñas coinciden</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Paso 3: Resumen + CTA ───────────────────────────── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <h2 className="text-lg font-black text-white">¡Todo listo!</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Revisa tu información antes de crear la cuenta</p>
                </div>

                {/* Resumen */}
                <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-2.5 text-sm">
                  {[
                    { label: "Nombre", value: `${nombre} ${apellido}` },
                    { label: "Email", value: email },
                    { label: "Especialidades", value: especialidadesSeleccionadas.length > 0
                      ? especialidades.filter(e => especialidadesSeleccionadas.includes(e.id)).map(e => e.nombre).join(", ")
                      : "Ninguna (configurable después)" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-slate-500 font-bold shrink-0">{label}:</span>
                      <span className="text-white text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Banner Trial */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <Gift size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-emerald-400">30 días de Plan Profesional — GRATIS</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Incluye: citas ilimitadas, hasta 500 pacientes, alertas por WhatsApp y portal público. Sin tarjeta de crédito.
                    </p>
                  </div>
                </div>

                {/* Beneficios rápidos */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: Shield, label: "Datos Seguros", color: "text-blue-400" },
                    { icon: Zap, label: "Acceso Inmediato", color: "text-amber-400" },
                    { icon: Star, label: "Sin compromiso", color: "text-violet-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="p-2.5 bg-white/3 border border-white/8 rounded-xl flex flex-col items-center gap-1.5">
                      <Icon size={14} className={color} />
                      <span className="text-[10px] font-bold text-slate-400 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Términos */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setAceptaTerminos(!aceptaTerminos)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      aceptaTerminos ? "bg-primary border-primary" : "border-white/20 bg-white/5"
                    }`}
                  >
                    {aceptaTerminos && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                    Acepto los <span className="text-primary underline">Términos de uso</span> y la{" "}
                    <span className="text-primary underline">Política de privacidad</span> de VitalNexus.
                  </span>
                </label>

                {/* CAPTCHA Turnstile */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield size={13} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verificación de seguridad</span>
                  </div>
                  <div className={`rounded-2xl border overflow-hidden transition-all ${
                    turnstileToken
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-white/10 bg-white/3"
                  }`}>
                    <div className="p-3">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                        onSuccess={(token) => setTurnstileToken(token)}
                        onError={() => setTurnstileToken(null)}
                        onExpire={() => setTurnstileToken(null)}
                        options={{ theme: "dark", language: "es" }}
                      />
                    </div>
                    {turnstileToken && (
                      <div className="px-3 pb-3 flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span className="text-xs font-bold">Verificación completada</span>
                      </div>
                    )}
                  </div>
                  {!turnstileToken && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-slate-600 pl-1">Completa la verificación para continuar</p>
                      {(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === "1x00000000000000000000AA" || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && (
                        <button
                          type="button"
                          onClick={() => setTurnstileToken("mock-token")}
                          className="text-xs text-left text-primary hover:text-primary/80 hover:underline font-bold pl-1 mt-1 w-fit transition-colors"
                        >
                          [Desarrollo] Simular Verificación Exitosa (Bypass)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navegación entre pasos */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setStep(s => s - 1); setError(null); }}
                className="flex-1 py-3.5 rounded-2xl border border-white/15 text-slate-400 hover:text-white hover:border-white/30 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => canAdvance() && setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Continuar <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canAdvance() || isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Creando cuenta...</>
                ) : (
                  <><Gift size={16} /> Crear cuenta gratis</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-5">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
