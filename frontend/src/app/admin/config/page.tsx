"use client";

import { Construction, Clock, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function UnderConstructionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-32 h-32 bg-violet-600/10 rounded-[40px] border border-violet-500/20 flex items-center justify-center mb-8 relative"
      >
        <Construction className="text-violet-500" size={64} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-2 -right-2 p-2 bg-indigo-600 rounded-2xl shadow-lg border border-indigo-400/30"
        >
          <Clock className="text-white" size={20} />
        </motion.div>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-black text-white mb-4 tracking-tight"
      >
        Configuración del Sistema
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-400 max-w-md text-lg font-medium leading-relaxed italic"
      >
        Esta sección se encuentra en desarrollo. Aquí podrás gestionar los parámetros globales del SaaS en el futuro.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        <Link 
          href="/admin/dashboard"
          className="group flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-violet-400 font-bold hover:bg-violet-600/10 hover:border-violet-500/30 transition-all active:scale-95"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
          Volver al Escritorio
        </Link>
      </motion.div>
    </div>
  );
}
