"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Activity, 
  DollarSign,
  ClipboardList
} from "lucide-react";

export default function DashboardMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-12 group">
      {/* Resplandor de fondo (Glow) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      
      {/* Contenedor Principal (Panel de Cristal) */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header del Mockup */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase">VitalNexus • Doctor Portal</div>
          <div className="w-6 h-6 rounded-full bg-white/10"></div>
        </div>

        {/* Contenido del Mockup */}
        <div className="p-6 grid grid-cols-12 gap-4">
          
          {/* Sidebar simulado */}
          <div className="col-span-3 space-y-4">
            <div className="h-4 w-full bg-white/10 rounded-md"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-3 w-full rounded-md ${i === 1 ? 'bg-primary/40' : 'bg-white/5'}`}></div>
              ))}
            </div>
            <div className="pt-8">
              <div className="h-20 w-full bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl border border-white/5 p-3 flex flex-col justify-end">
                <div className="h-2 w-1/2 bg-white/40 rounded-full mb-1"></div>
                <div className="h-1 w-full bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Grid Principal simulado */}
          <div className="col-span-9 space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users, label: "Pacientes", val: "+24", color: "text-blue-400" },
                { icon: Calendar, label: "Citas Hoy", val: "12", color: "text-primary" },
                { icon: TrendingUp, label: "Ingresos", val: "+18%", color: "text-green-400" }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-[10px] text-white/40">Este mes</span>
                  </div>
                  <div className="text-lg font-bold text-white/90">{stat.val}</div>
                  <div className="text-[10px] text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Gráfico y Actividad simula */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 h-40 flex items-end gap-1">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.8 }}
                    className="flex-1 bg-primary/30 rounded-t-sm hover:bg-primary/60 transition-colors"
                  ></motion.div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="text-[10px] font-bold text-white/60 mb-2">PACIENTES RECIENTES</div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/10 shrink-0"></div>
                    <div className="space-y-1 w-full">
                      <div className="h-2 w-3/4 bg-white/20 rounded-full"></div>
                      <div className="h-1 w-1/2 bg-white/10 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fila inferior simula Tabla/Citas */}
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-bold text-white/60">PRÓXIMAS CITAS</div>
                <div className="text-[10px] text-primary hover:underline cursor-pointer">Ver todas</div>
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-white/80 font-medium">Paciente #00{i}</div>
                        <div className="text-[10px] text-white/40">Consulta General • 10:30 AM</div>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded bg-green-500/10 text-[9px] text-green-400 border border-green-500/20">Confirmada</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
