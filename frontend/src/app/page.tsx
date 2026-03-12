"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, ShieldCheck, Activity, Stethoscope, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { login } = useAuth();
  
  // Estado local para los inputs del formulario
  const [email, setEmail] = useState("admin@odontofocus.com");
  const [password, setPassword] = useState("123456"); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorLogin("");

    try {
      // Endpoint FastAPI /api/auth/login (Consume JSON)
      const payload = {
        email: email,
        password: password
      };

      const resp = await api.post("/api/auth/login", payload);
      
      // La API devuelve un token JWT
      await login(resp.data.access_token);
      
    } catch (_err) {
      setErrorLogin("Credenciales incorrectas o servidor no disponible.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      
      {/* Elementos Decorativos de Fondo Flotantes */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute top-[10%] left-[15%] text-primary/20 pointer-events-none"
      >
        <Stethoscope size={240} strokeWidth={1} />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 30, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[10%] right-[15%] text-primary/10 pointer-events-none"
      >
        <Activity size={320} strokeWidth={1} />
      </motion.div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-center justify-center z-10">
        
        {/* Lado Izquierdo: Presentación */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 w-full text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 shadow-sm border border-primary/20 hover-glow">
            <ShieldCheck size={16} />
            <span>Sistema Multitenant Seguro</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
             Odonto-Focus <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
               Next-Gen Médico SaaS
             </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto md:mx-0">
             Una solución premium para especialistas que buscan digitalizar su clínica con inteligencia, inventario en tiempo real y comunicación por WhatsApp de nivel superior.
          </p>
          <div className="flex gap-4 items-center justify-center md:justify-start">
             <div className="flex -space-x-3">
               {[1,2,3,4].map((i) => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Doctor" className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
             <p className="text-sm font-medium text-muted-foreground">Más de 2k+ Especialistas sumados.</p>
          </div>
        </motion.div>

        {/* Lado Derecho: Tarjeta de Iniciar Sesión (Glassmorphism) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 w-full max-w-md"
        >
          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[50px] bg-primary/30 blur-[40px] pointer-events-none transition-all group-hover:bg-primary/50" />
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-bold mb-2">Bienvenido de Vuelta</h2>
              <p className="text-muted-foreground text-sm">Inicia sesión en tu consultorio digital</p>
            </div>

            <form className="space-y-5 relative z-10" onSubmit={handleLogin}>
              
              {/* Notificación de Error */}
              {errorLogin && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-fade-in text-center">
                  {errorLogin}
                </div>
              )}

              <div className="space-y-1 group/input">
                <label className="text-sm font-medium pl-1 text-foreground/80 group-focus-within/input:text-primary transition-colors">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <User size={18} />
                  </div>
                  <input 
                    type="email" 
                    placeholder="dr.carlos@clinica.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-background/50 border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent block pl-10 p-3 outline-none transition-all glass-panel group-hover/input:border-primary/50"
                  />
                </div>
              </div>

              <div className="space-y-1 group/input">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-sm font-medium text-foreground/80 group-focus-within/input:text-primary transition-colors">Contraseña</label>
                  <a href="#" className="text-xs text-primary hover:underline font-medium">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-background/50 border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent block pl-10 p-3 outline-none transition-all glass-panel group-hover/input:border-primary/50"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl p-3 flex items-center justify-center gap-2 transform transition-all active:scale-95 shadow-lg shadow-primary/25 hover:shadow-primary/40 mt-6 disabled:opacity-75 disabled:active:scale-100"
              >
                {isLoading ? (
                  <>Autenticando <Loader2 size={18} className="animate-spin"/></>
                ) : (
                  <>Entrar al Sistema <ArrowRight size={18} /></>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center text-sm text-muted-foreground relative z-10">
              ¿No tienes una cuenta? <a href="#" className="text-primary font-semibold hover:underline">Solicita un Demo Relevante</a>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
