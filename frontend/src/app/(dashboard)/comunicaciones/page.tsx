"use client";

import { MessageSquare, Clock, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function ComunicacionesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20"
      >
        <MessageSquare size={48} />
      </motion.div>
      
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          Comunicaciones Inteligentes
        </h1>
        <p className="text-lg text-muted-foreground font-medium italic">
          "Conectando especialistas con sus pacientes a través de tecnología de vanguardia."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-8">
        <div className="glass-panel p-6 rounded-[1.5rem] space-y-3 border-none bg-white/50 dark:bg-slate-800/40">
          <Clock className="text-primary mx-auto" size={32} />
          <h3 className="font-bold">Recordatorios</h3>
          <p className="text-xs text-muted-foreground">Automatización de citas por WhatsApp para reducir inasistencias.</p>
        </div>
        <div className="glass-panel p-6 rounded-[1.5rem] space-y-3 border-none bg-white/50 dark:bg-slate-800/40 border-primary/20 ring-1 ring-primary/10">
          <Zap className="text-amber-500 mx-auto" size={32} />
          <h3 className="font-bold">Próximamente</h3>
          <p className="text-xs text-muted-foreground">Estamos puliendo los últimos detalles de la integración con YCloud.</p>
        </div>
        <div className="glass-panel p-6 rounded-[1.5rem] space-y-3 border-none bg-white/50 dark:bg-slate-800/40">
          <ShieldCheck className="text-green-500 mx-auto" size={32} />
          <h3 className="font-bold">Seguridad</h3>
          <p className="text-xs text-muted-foreground">Mensajería encriptada y cumplimiento de normativas de salud.</p>
        </div>
      </div>

      <p className="text-sm font-bold text-primary/60 animate-pulse tracking-widest uppercase pt-8">
        Fase 4: Integración YCloud en Proceso
      </p>
    </div>
  );
}
