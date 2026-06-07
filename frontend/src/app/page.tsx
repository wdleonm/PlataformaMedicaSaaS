"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Stethoscope, 
  Loader2, 
  Eye, 
  EyeOff, 
  Clock,
  Zap,
  BarChart3,
  Calendar,
  ClipboardList,
  Users,
  Globe,
  Phone,
  Mail,
  MapPin,
  X,
  Play
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardMockup from "@/components/landing/DashboardMockup";
import VideoCarousel from "@/components/landing/VideoCarousel";
import Link from "next/link";

export default function Home() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  useEffect(() => {
    const expired = sessionStorage.getItem("session_expired");
    if (expired) {
      setSessionExpiredMsg(true);
      sessionStorage.removeItem("session_expired");
      const timer = setTimeout(() => setSessionExpiredMsg(false), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorLogin("");

    try {
      const payload = { email, password };
      const resp = await api.post("/api/auth/login", payload);
      await login(resp.data.access_token);
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorLogin(
        err.response?.data?.detail || 
        "Credenciales incorrectas o servidor no disponible."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-[#d3e4fe] selection:bg-cyan-500/30 selection:text-cyan-400 overflow-x-hidden font-sans">
      
      {/* MODAL DE DEMO */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-cyan-500/10 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden z-10 flex flex-col"
            >
              <button 
                onClick={() => setIsDemoModalOpen(false)}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-zinc-950/80 hover:bg-zinc-900 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-cyan-500/20 transition-all"
              >
                <X size={20} />
              </button>

              <div className="aspect-video bg-black relative flex items-center justify-center group">
                <img src="/images/doctor_tablet.png" alt="Demo Preview" className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-cyan-500/20 hover:bg-cyan-500/40 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 border border-cyan-500/30 group-hover:border-cyan-400/60 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                    <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                  </div>
                  <p className="text-white font-semibold text-sm tracking-widest uppercase text-shadow-sm pl-1">Reproducir Video Demo</p>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-gradient-to-br from-zinc-950 to-zinc-900 border-t border-cyan-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 font-sans tracking-tight">¿Listo para evolucionar tu clínica?</h3>
                  <p className="text-[#bcc9cd] text-sm max-w-lg">
                    No pierdas más tiempo en tareas manuales. Comienza hoy mismo con todas las funcionalidades activas y sin necesidad de tarjeta de crédito.
                  </p>
                </div>
                <Link 
                  href="/register"
                  className="shrink-0 w-full md:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 rounded-xl font-bold text-[#003640] text-base shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  Probar 30 días Gratis <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOW DE FONDO AMBIENTAL */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-cyan-500/5 blur-[130px] rounded-full -z-10 pointer-events-none" />

      {/* --- CINTILLO SUPERIOR (TOP BAR) --- */}
      <div className="fixed top-0 w-full z-[60] bg-zinc-950/70 backdrop-blur-md border-b border-cyan-500/10 py-2.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] text-[#bcc9cd] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-default">
              <Phone className="w-3.5 h-3.5 text-cyan-400" /> +58 0412-4444621
            </div>
            <div className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-default">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> smartlift1608@gmail.com
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div className="flex items-center gap-2 cursor-default">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Valencia, Edo. Carabobo 
            </div>
            <div className="flex items-center gap-2 cursor-default border-l border-cyan-500/20 pl-6">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* --- Navegación Minimalista --- */}
      <nav className="fixed top-0 md:top-10 w-full z-50 bg-zinc-950/70 backdrop-blur-xl border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Activity className="text-[#003640] w-6 h-6 md:w-7 md:h-7" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tight text-white font-sans">VitalNexus</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#beneficios" className="text-xs font-bold uppercase tracking-wider text-[#bcc9cd] hover:text-white transition-colors hidden md:block">Beneficios</a>
            <a href="#precios" className="text-xs font-bold uppercase tracking-wider text-[#bcc9cd] hover:text-white transition-colors hidden md:block">Precios</a>
            <a href="#como-funciona" className="text-xs font-bold uppercase tracking-wider text-[#bcc9cd] hover:text-white transition-colors hidden md:block">Cómo funciona</a>
            <button 
              onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 rounded-lg bg-transparent border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/5 text-cyan-400 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* --- HERO SECTION --- */}
        <section className="pt-32 md:pt-40 pb-16 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-6 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span>Propulsando 2.4k+ Centros Médicos</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-[1.1] text-white font-sans">
              La Evolución <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">
                Digital de tu <br/> Práctica Médica
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-[#bcc9cd] max-w-lg mb-10 leading-relaxed font-normal">
              <strong className="text-white font-bold">VitalNexus:</strong> Gestión de alta precisión y control financiero integrado. Diseñado ergonómicamente para que los especialistas médicos tomen el control total.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
              <Link 
                href="/register"
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 rounded-xl font-bold text-base text-[#003640] shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Comenzar gratis <ArrowRight size={18} />
              </Link>
              <button 
                onClick={() => setIsDemoModalOpen(true)}
                className="px-8 py-4 bg-transparent border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/5 text-cyan-400 rounded-xl font-bold text-base hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Ver Demo <Zap size={18} className="text-cyan-400" />
              </button>
            </div>

            {/* METRICAS DE IMPACTO */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-8 border-t border-cyan-500/10 w-full">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white flex items-center justify-center lg:justify-start gap-2">
                   <Users className="w-5 h-5 text-cyan-400" /> +2,400
                </div>
                <div className="text-[9px] text-[#bcc9cd] uppercase tracking-widest font-bold">Especialistas</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white flex items-center justify-center lg:justify-start gap-2">
                   <Users className="w-5 h-5 text-blue-400" /> +150k
                </div>
                <div className="text-[9px] text-[#bcc9cd] uppercase tracking-widest font-bold">Pacientes</div>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <div className="text-2xl font-bold text-white flex items-center justify-center lg:justify-start gap-2">
                   <Globe className="w-5 h-5 text-indigo-400" /> 99.9%
                </div>
                <div className="text-[9px] text-[#bcc9cd] uppercase tracking-widest font-bold">Uptime Cloud</div>
              </div>
            </div>
          </motion.div>

          {/* MOCKUP ELEVADO PARA VISIBILIDAD INMEDIATA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="w-full relative lg:translate-x-12"
          >
            {/* Decoración detrás del mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[60%] bg-cyan-500/10 blur-[80px] -z-10 rounded-full" />
            <DashboardMockup />
          </motion.div>
        </section>

        {/* --- BENEFICIOS (GRID) --- */}
        <section id="beneficios" className="py-24 px-6 bg-zinc-950/20 relative overflow-hidden border-t border-cyan-500/10">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 font-sans tracking-tight text-white">Diseñado para la Rentabilidad</h2>
              <p className="text-[#bcc9cd] text-sm">Todo lo que necesitas para que tu clínica funcione con precisión clínica.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: ClipboardList, 
                  title: "Historial Clínico Inteligente", 
                  desc: "Historias modulares por especialidad con sincronización automática de alertas médicas.",
                  color: "from-blue-500/20"
                },
                { 
                  icon: BarChart3, 
                  title: "Análisis Financiero Real", 
                  desc: "Calcula tu utilidad neta por servicio restando automáticamente el costo de insumos.",
                  color: "from-cyan-500/20"
                },
                { 
                  icon: ShieldCheck, 
                  title: "Aislamiento de Datos RLS", 
                  desc: "Tus datos y los de tus pacientes están blindados bajo la tecnología Row Level Security de PostgreSQL.",
                  color: "from-cyan-500/20"
                },
                { 
                  icon: Zap, 
                  title: "Odontograma Evolutivo", 
                  desc: "Visualiza el progreso de tus pacientes con un solo clic. Sin sobreescrituras, solo historia pura.",
                  color: "from-amber-500/20"
                },
                { 
                  icon: Activity, 
                  title: "Gestión de Citas", 
                  desc: "Calendario dinámico con recordatorios automáticos vía WhatsApp para reducir inasistencias.",
                  color: "from-rose-500/20"
                },
                { 
                  icon: Stethoscope, 
                  title: "Portal de Especialista", 
                  desc: "Gestiona múltiples sucursales y personaliza tu firma y sellos digitales en segundos.",
                  color: "from-indigo-500/20"
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-2xl bg-zinc-950/70 backdrop-blur-xl border border-cyan-500/10 hover:border-cyan-400/40 transition-all hover:shadow-[0_0_35px_rgba(34,211,238,0.05)] group bg-gradient-to-b from-transparent to-transparent hover:to-cyan-500/5"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} to-transparent flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                    <item.icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white font-sans">{item.title}</h3>
                  <p className="text-[#bcc9cd] leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- TARJETAS DE PRECIOS --- */}
        <section id="precios" className="py-24 px-6 bg-slate-900/10 relative overflow-hidden border-t border-cyan-500/10">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-4 border border-cyan-500/20">
                <span>Planes Flexibles</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 font-sans tracking-tight text-white">Precios Claros y Transparentes</h2>
              <p className="text-[#bcc9cd] text-sm max-w-lg mx-auto">Comienza hoy mismo con una prueba gratuita de 30 días. Sin contratos ni sorpresas.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              
              {/* PLAN BASICO */}
              <div className="p-8 rounded-2xl bg-zinc-950/70 backdrop-blur-xl border border-cyan-500/10 flex flex-col justify-between hover:border-cyan-400/20 transition-all">
                <div>
                  <h3 className="text-xs font-bold text-[#bcc9cd] uppercase tracking-widest mb-2">Plan Básico</h3>
                  <p className="text-xs text-slate-500 mb-6">Para consultorios independientes o en inicio.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-white font-sans">$19</span>
                    <span className="text-xs text-[#bcc9cd] uppercase tracking-wider">/ mes</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm text-[#bcc9cd]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Hasta 500 Pacientes activos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Historial Clínico estándar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Agenda y Citas médicas</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0"></span>
                      <span>Sin odontograma evolutivo</span>
                    </li>
                  </ul>
                </div>
                <Link 
                  href="/register"
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 border border-cyan-500/20 text-white font-bold rounded-xl text-center transition-all block text-xs uppercase tracking-wider"
                >
                  Probar Gratis
                </Link>
              </div>

              {/* PLAN PROFESIONAL */}
              <div className="p-8 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border-2 border-cyan-400 flex flex-col justify-between relative shadow-[0_0_40px_rgba(6,182,212,0.1)] hover:border-cyan-300 transition-all transform md:-translate-y-2">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyan-500 text-[#003640] font-black text-[9px] uppercase tracking-widest shadow-lg shadow-cyan-500/20">
                  Recomendado
                </div>
                <div>
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Plan Profesional</h3>
                  <p className="text-xs text-slate-400 mb-6">La suite completa para tu práctica clínica.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-white font-sans">$29</span>
                    <span className="text-xs text-[#bcc9cd] uppercase tracking-wider">/ mes</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm text-[#d3e4fe]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span className="font-semibold">Pacientes ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span className="font-semibold">Odontograma evolutivo avanzado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Recetas y Análisis financiero real</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Recordatorios por WhatsApp</span>
                    </li>
                  </ul>
                </div>
                <Link 
                  href="/register"
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-center transition-all block text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/10 hover:scale-[1.02]"
                >
                  Comenzar 30 días Gratis
                </Link>
              </div>

              {/* PLAN ENTERPRISE */}
              <div className="p-8 rounded-2xl bg-zinc-950/70 backdrop-blur-xl border border-cyan-500/10 flex flex-col justify-between hover:border-cyan-400/20 transition-all">
                <div>
                  <h3 className="text-xs font-bold text-[#bcc9cd] uppercase tracking-widest mb-2">Plan Enterprise</h3>
                  <p className="text-xs text-slate-500 mb-6">Para clínicas de salud y múltiples sucursales.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-white font-sans">$79</span>
                    <span className="text-xs text-[#bcc9cd] uppercase tracking-wider">/ mes</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm text-[#bcc9cd]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Especialistas ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Gestión de sucursales</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Firma y sellos digitales a medida</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span>Soporte 24/7 y API privada</span>
                    </li>
                  </ul>
                </div>
                <Link 
                  href="/register"
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 border border-cyan-500/20 text-white font-bold rounded-xl text-center transition-all block text-xs uppercase tracking-wider"
                >
                  Contactar Ventas
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* --- CÓMO FUNCIONA --- */}
        <section id="como-funciona" className="py-24 px-6 max-w-7xl mx-auto border-t border-cyan-500/10">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight">Digitaliza tu consulta en <span className="text-cyan-400 italic">minutos</span></h2>
              <div className="space-y-6">
                {[
                  { n: "01", t: "Regístrate como Especialista", d: "Crea tu cuenta profesional y selecciona tu especialidad médica." },
                  { n: "02", t: "Configura tu Consultorio", d: "Añade tus servicios, insumos y configura tu agenda personalizada." },
                  { n: "03", t: "Importa o Crea Pacientes", d: "Sube tu base de datos actual o empieza a crear historias desde cero." },
                  { n: "04", t: "Analiza tu Ganancia", d: "Observa en tiempo real la rentabilidad de cada tratamiento realizado." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="text-3xl font-bold text-slate-800 group-hover:text-cyan-400 transition-colors font-sans">{step.n}</div>
                    <div>
                      <h4 className="font-bold text-lg mb-1 text-white font-sans">{step.t}</h4>
                      <p className="text-[#bcc9cd] text-sm">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full max-w-md bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl p-0.5 border border-cyan-500/20 hover:shadow-cyan-500/5 shadow-2xl transition-all">
              <div className="aspect-[4/5] bg-zinc-950 rounded-2xl overflow-hidden relative">
                 <img src="/images/doctor_tablet.png" alt="Médico usando tablet digital" className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
                 <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-cyan-500 p-4 rounded-xl flex items-center gap-4 shadow-xl">
                      <div className="bg-white/20 p-2 rounded-lg"><Activity className="text-[#003640]" /></div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-[#003640]/70">Eficiencia Médica</div>
                        <div className="text-sm font-bold text-[#003640]">Digitalización Aumentada</div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- LOGIN SECTION — Split Video + Form --- */}
        <section id="login-section" className="relative border-t border-cyan-500/10 bg-black/10 min-h-[80vh] flex items-center">
          <div className="absolute inset-0 bg-cyan-500/5 -z-10 blur-3xl rounded-full max-w-4xl mx-auto translate-y-20 pointer-events-none"></div>
          
          <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-0 items-stretch min-h-[80vh]">
            
            {/* LEFT — Login Form */}
            <div className="flex items-center justify-center p-8 lg:p-16 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-10 rounded-2xl border border-cyan-500/10 shadow-2xl relative overflow-hidden group bg-zinc-950/75 backdrop-blur-xl w-full max-w-md"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[220px] h-[50px] bg-cyan-500/20 blur-[40px] pointer-events-none group-hover:bg-cyan-500/30 transition-all" />

                <div className="text-center mb-10 relative z-10">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white font-sans tracking-tight">Entrar al Sistema</h2>
                  <p className="text-[#bcc9cd] text-sm">Gestiona tu clínica con máxima precisión</p>
                </div>

                <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
                  {sessionExpiredMsg && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[13px] flex items-center gap-3">
                      <Clock size={16} /> Tu sesión expiró por inactividad.
                    </div>
                  )}

                  {errorLogin && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] text-center">
                      {errorLogin}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Correo Electrónico</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input 
                        type="email" 
                        placeholder="ejemplo@medico.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full bg-zinc-950/50 border border-cyan-500/25 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contraseña</label>
                      <a href="#" className="text-xs text-cyan-400 hover:underline">¿Olvidaste tu clave?</a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full bg-zinc-950/50 border border-cyan-500/25 rounded-xl py-3 pl-12 pr-12 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl py-4 shadow-lg shadow-cyan-500/10 hover:scale-[1.01] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Entrar ahora <ArrowRight size={20} /></>}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 relative z-10">
                  ¿Aún no eres parte? <Link href="/register" className="text-cyan-400 font-bold hover:underline">Registrar Especialista (30 días Gratis)</Link>
                </div>
              </motion.div>
            </div>

            {/* RIGHT — Video Carousel */}
            <div className="hidden lg:block relative overflow-hidden">
              <VideoCarousel />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-cyan-500/10 bg-zinc-950/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-cyan-500 flex items-center justify-center">
              <Activity className="text-[#003640] w-4 h-4" />
            </div>
            <span className="font-bold opacity-90 text-white font-sans">VitalNexus CRM</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 VitalNexus Engine. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-white text-sm">Privacidad</a>
            <a href="#" className="text-slate-500 hover:text-white text-sm">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
