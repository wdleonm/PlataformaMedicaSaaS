"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  CreditCard, 
  Plus, 
  Check, 
  X, 
  Loader2,
  Package,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  precio_mensual: number;
  max_pacientes: number | null;
  max_citas_mes: number | null;
  incluye_whatsapp: boolean;
  incluye_multiusuario: boolean;
  activo: boolean;
}

export default function AdminPlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const { data } = await api.get("/api/admin/planes/");
        setPlanes(data);
      } catch (err) {
        console.error("Error fetching planes:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlanes();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Planes de Suscripción</h1>
          <p className="text-slate-400 mt-1 font-medium">Configura la oferta comercial y los límites de la plataforma.</p>
        </div>
        <button className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-violet-900/20 active:scale-95 transition-all text-sm">
          <Plus size={18} /> Crear Nuevo Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin text-violet-500 mx-auto" size={40} />
          </div>
        ) : planes.map((plan, idx) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative bg-white/5 border rounded-[40px] p-8 flex flex-col h-full group ${
                plan.activo ? "border-white/10" : "border-red-500/20 grayscale opacity-60"
            }`}
          >
            {plan.codigo === 'profesional' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ring-4 ring-[#0a0514]">
                Más Popular
              </div>
            )}

            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-3xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
                <Package size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{plan.codigo}</p>
                <h3 className="text-2xl font-black text-white">{plan.nombre}</h3>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">${plan.precio_mensual}</span>
                <span className="text-slate-500 font-bold text-sm">/mes</span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Check size={12} strokeWidth={4} />
                </div>
                <span className="text-slate-300 font-medium">
                  {plan.max_pacientes ? `${plan.max_pacientes} Pacientes` : "Pacientes Ilimitados"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Check size={12} strokeWidth={4} />
                </div>
                <span className="text-slate-300 font-medium">
                  {plan.max_citas_mes ? `${plan.max_citas_mes} Citas / mes` : "Citas Ilimitadas"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.incluye_whatsapp ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-600"}`}>
                  {plan.incluye_whatsapp ? <Check size={12} strokeWidth={4} /> : <X size={12} />}
                </div>
                <span className={`${plan.incluye_whatsapp ? "text-slate-300" : "text-slate-600"} font-medium`}>Alertas WhatsApp</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.incluye_multiusuario ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-slate-600"}`}>
                  {plan.incluye_multiusuario ? <Check size={12} strokeWidth={4} /> : <X size={12} />}
                </div>
                <span className={`${plan.incluye_multiusuario ? "text-slate-300" : "text-slate-600"} font-medium`}>Multi-Usuario</span>
              </div>
            </div>

            <button className="w-full mt-10 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all group-hover:border-violet-500/50">
              Editar Características
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
