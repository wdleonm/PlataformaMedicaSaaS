"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  CheckCircle2,
  Calendar,
  ClipboardList,
  Users,
  Globe,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardMockup from "@/components/landing/DashboardMockup";

export default function Home() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);

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
    <div className="relative min-h-screen bg-[#020617] text-slate-50 selection:bg-primary/30 selection:text-primary overflow-x-hidden font-sans">
      
      {/* GLOW DE FONDO AMBIENTAL */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* --- CINTILLO SUPERIOR (TOP BAR) --- */}
      <div className="fixed top-0 w-full z-[60] bg-[#020617]/80 backdrop-blur-md border-b border-white/5 py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[11px] text-slate-400 font-medium tracking-wide">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
              <Phone className="w-3 h-3 text-primary" /> +58 0412-4444621
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-default">
              <Mail className="w-3 h-3 text-primary" /> smartlift1608@gmail.com
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
            <div className="flex items-center gap-2 cursor-default">
              <MapPin className="w-3 h-3 text-primary" /> Valencia, Edo. Carabobo 
            </div>
            <div className="flex items-center gap-2 cursor-default border-l border-white/10 pl-6">
              <Calendar className="w-3 h-3 text-primary" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* --- Navegación Minimalista --- */}
      <nav className="fixed top-0 md:top-8 w-full z-50 bg-black/20 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Activity className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-white">VitalNexus</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#beneficios" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Beneficios</a>
            <a href="#como-funciona" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Cómo funciona</a>
            <button 
              onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* --- HERO SECTION --- (Optimizado para evitar espacio vacío) */}
        <section className="pt-28 pb-16 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs mb-6 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Propulsando 2.4k+ Centros Médicos</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.05]">
              La Evolución <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400">
                Digital de tu <br/> Práctica Médica
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-lg mb-10 leading-relaxed">
              <strong className="text-white">VitalNexus:</strong> Gestión de alta precisión y control financiero. Diseñado para que especialistas como tú tomen el control total de su consulta.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
              <button 
                onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 bg-primary hover:bg-primary/90 rounded-2xl font-bold text-base shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Comenzar ahora <ArrowRight size={18} />
              </button>
              <button 
                className="px-8 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-base border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Ver Demo <Zap size={18} className="text-primary" />
              </button>
            </div>

            {/* METRICAS DE IMPACTO (Rellena el espacio vacío y da confianza) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-8 border-t border-white/5 w-full">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                   <Users className="w-5 h-5 text-primary" /> +2,400
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Especialistas</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                   <Users className="w-5 h-5 text-blue-400" /> +150k
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pacientes</div>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <div className="text-2xl font-bold text-white flex items-center gap-2">
                   <Globe className="w-5 h-5 text-cyan-400" /> 99.9%
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Uptime Cloud</div>
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[60%] bg-primary/20 blur-[80px] -z-10 rounded-full" />
            <DashboardMockup />
          </motion.div>
        </section>

        {/* --- BENEFICIOS (GRID) --- */}
        <section id="beneficios" className="py-24 px-6 bg-slate-900/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Diseñado para la Rentabilidad</h2>
              <p className="text-slate-400">Todo lo que necesitas para que tu clínica funcione como un reloj suizo.</p>
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
                  color: "from-primary/20"
                },
                { 
                  icon: ShieldCheck, 
                  title: "Aislamiento de Datos RLS", 
                  desc: "Tus datos y los de tus pacientes están blindados bajo la tecnología Row Level Security.",
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
                  className="p-8 rounded-3xl bg-slate-800/50 border border-white/5 hover:border-primary/50 transition-all hover:shadow-[0_0_30px_rgba(var(--primary),0.05)] group bg-gradient-to-b from-transparent to-transparent hover:to-primary/5"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} to-transparent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- CÓMO FUNCIONA --- */}
        <section id="como-funciona" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-4xl font-bold font-sans">Digitaliza tu consulta en <span className="text-primary italic">minutos</span></h2>
              <div className="space-y-6">
                {[
                  { n: "01", t: "Regístrate como Especialista", d: "Crea tu cuenta profesional y selecciona tu especialidad médica." },
                  { n: "02", t: "Configura tu Consultorio", d: "Añade tus servicios, insumos y configura tu agenda personalizada." },
                  { n: "03", t: "Importa o Crea Pacientes", d: "Sube tu base de datos actual o empieza a crear historias desde cero." },
                  { n: "04", t: "Analiza tu Ganancia", d: "Observa en tiempo real la rentabilidad de cada tratamiento realizado." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="text-4xl font-black text-slate-800 group-hover:text-primary transition-colors">{step.n}</div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{step.t}</h4>
                      <p className="text-slate-400 text-sm">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full max-w-md bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-[3rem] p-1 border border-white/10 hover:shadow-primary/5 shadow-2xl transition-all">
              <div className="aspect-[4/5] bg-slate-900 rounded-[2.8rem] overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1576091160550-217359f4ecf8?auto=format&fit=crop&q=80&w=800" alt="Médico usando tablet" className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                 <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-primary p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                      <div className="bg-white/20 p-2 rounded-lg"><Activity className="text-white" /></div>
                      <div>
                        <div className="text-xs text-white/70">Eficiencia Médica</div>
                        <div className="text-sm font-bold text-white">Digitalización Aumentada</div>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- LOGIN SECTION --- */}
        <section id="login-section" className="py-24 px-6 relative border-t border-white/5 bg-black/20">
          <div className="absolute inset-0 bg-primary/5 -z-10 blur-3xl rounded-full max-w-4xl mx-auto translate-y-20"></div>
          <div className="max-w-md mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="glass-panel p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group bg-slate-900/80"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[50px] bg-primary/30 blur-[40px] pointer-events-none group-hover:bg-primary/50 transition-all" />

              <div className="text-center mb-10 relative z-10">
                <h2 className="text-3xl font-bold mb-2">Entrar al Sistema</h2>
                <p className="text-slate-400 text-sm">Gestiona tu clínica desde cualquier lugar</p>
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
                  <label className="text-sm font-medium text-slate-300 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="ejemplo@medico.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-medium text-slate-300">Contraseña</label>
                    <a href="#" className="text-xs text-primary hover:underline">¿Perdiste tu clave?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-12 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl py-4 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Entrar ahora <ArrowRight size={20} /></>}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-slate-500 relative z-10">
                ¿Aún no eres parte? <a href="#" className="text-primary font-bold hover:underline">Registrar Clínica</a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 bg-black/40 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center">
              <Activity className="text-white w-4 h-4" />
            </div>
            <span className="font-bold opacity-80">VitalNexus CRM</span>
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
