"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  UserPlus,
  Clock,
  Loader2,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  total_especialistas: number;
  especialistas_activos: number;
  especialistas_nuevos_mes: number;
  suscripciones_por_vencer_30d: number;
  ingresos_estimados_mes: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/api/admin/dashboard/");
        setStats(data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" size={40} />
      </div>
    );
  }

  const statCards = [
    { 
      label: "Total Especialistas", 
      value: stats?.total_especialistas || 0, 
      icon: Users, 
      trend: "+12%", 
      color: "from-violet-600 to-indigo-600" 
    },
    { 
      label: "Especialistas Activos", 
      value: stats?.especialistas_activos || 0, 
      icon: Activity, 
      trend: "Estable", 
      color: "from-blue-600 to-cyan-600" 
    },
    { 
      label: "Nuevos del Mes", 
      value: stats?.especialistas_nuevos_mes || 0, 
      icon: UserPlus, 
      trend: "+3", 
      color: "from-emerald-600 to-teal-600" 
    },
    { 
      label: "Suscripciones por Vencer", 
      value: stats?.suscripciones_por_vencer_30d || 0, 
      icon: Clock, 
      trend: "Atención", 
      color: "from-orange-600 to-amber-600" 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Dashboard General</h1>
          <p className="text-slate-400 mt-2 font-medium">Resumen del estado actual de tu plataforma SaaS.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Sistema Operativo</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] blur-xl" />
            <div className="relative bg-white/5 border border-white/10 p-6 rounded-[32px] shadow-sm hover:border-violet-500/30 transition-all duration-500">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} shadow-lg ring-4 ring-white/5`}>
                  <card.icon className="text-white" size={24} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  <TrendingUp size={10} />
                  {card.trend}
                </div>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-white">{card.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Projection */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[40px] p-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={160} className="text-violet-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-violet-400" size={20} />
                Proyección Mensual
              </h3>
              <button className="text-violet-400 text-xs font-bold hover:underline">Ver reporte detallado</button>
            </div>
            
            <div className="mt-auto">
              <p className="text-slate-400 text-sm font-medium mb-1">Ingresos estimados para este periodo:</p>
              <h4 className="text-5xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                ${stats?.ingresos_estimados_mes?.toLocaleString() || "0.00"}
              </h4>
              <div className="flex items-center gap-4 mt-8">
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden p-[2px] ring-1 ring-white/10">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full w-[65%]" />
                </div>
                <span className="text-xs font-bold text-violet-400">65% Meta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-2xl shadow-violet-900/40 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity size={20} />
              Acciones Rápidas
            </h3>
            <div className="space-y-4">
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-4 rounded-2xl flex items-center justify-between px-6 transition-all group/btn active:scale-[0.98]">
                <span className="font-bold text-sm">Registrar Especialista</span>
                <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-4 rounded-2xl flex items-center justify-between px-6 transition-all group/btn active:scale-[0.98]">
                <span className="font-bold text-sm">Crear Nuevo Plan</span>
                <PlusIcon size={18} className="group-hover/btn:rotate-90 transition-transform" />
              </button>
              <button className="w-full bg-white/20 hover:bg-white/30 border border-white/30 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all font-black text-sm tracking-tight active:scale-[0.98]">
                Enviar Reporte Global
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon({ size, className }: { size: number, className: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M5 12h14M12 5v14" />
        </svg>
    );
}
