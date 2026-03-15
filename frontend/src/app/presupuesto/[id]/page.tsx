"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  Calendar, 
  User, 
  ShieldCheck,
  ChevronRight,
  Info,
  FileText,
  Clock,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

interface BudgetData {
  id: string;
  fecha: string;
  total: number;
  saldo_pendiente: number;
  estado: string;
  validez_fecha: string | null;
  notas: string | null;
  paciente: {
    nombre: string;
    documento: string;
  };
  especialista: {
    nombre: string;
    email: string;
  };
  detalles: Array<{
    id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

export default function PublicBudgetPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchBudget() {
      try {
        const { data } = await api.get(`/api/public/presupuesto/${id}`);
        setData(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchBudget();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0514] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-violet-400 font-medium animate-pulse tracking-widest uppercase text-xs">Preparando Presupuesto...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0a0514] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
        <Info className="text-red-400" size={40} />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Presupuesto no encontrado</h1>
      <p className="text-slate-400 max-w-sm mb-8">El enlace es inválido o el presupuesto ha sido eliminado del sistema.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-8 print:p-0 print:bg-white">
      {/* Botones de Acción (No imprimir) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
          <ChevronRight className="rotate-180" size={16} /> Volver
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-700">
            <Printer size={20} />
          </button>
          <button className="p-3 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-500/20 hover:scale-105 transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto bg-white rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="text-white" size={24} />
                </div>
                <span className="text-xl font-black tracking-tighter uppercase font-sans">OdontoFocus</span>
              </div>
              <h1 className="text-3xl font-black mb-1">Presupuesto Médico</h1>
              <p className="text-slate-400 font-mono text-xs">Referencia: {data.id.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="text-right">
              <p className="text-violet-400 font-black uppercase tracking-widest text-[10px] mb-2 text-right">Estado del Presupuesto</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full font-bold text-sm uppercase ${
                data.estado === 'borrador' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                data.estado === 'pendiente' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {data.estado}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-12">
          {/* Info Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Paciente</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-500">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{data.paciente.nombre}</p>
                    <p className="text-sm text-slate-500">ID: {data.paciente.documento}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Emisión y Validez</p>
              <div className="space-y-3 flex flex-col md:items-end">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Calendar size={16} className="text-violet-500" /> Fecha: {new Date(data.fecha).toLocaleDateString()}
                </div>
                {data.validez_fecha && (
                  <div className="flex items-center gap-2 text-sm font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                    <Clock size={16} /> Válido hasta: {new Date(data.validez_fecha).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="space-y-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detalle de Servicios</p>
             <div className="border border-slate-100 rounded-[32px] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-black text-slate-900 uppercase tracking-tighter italic">Descripción</th>
                      <th className="px-6 py-4 text-center font-black text-slate-900 uppercase tracking-tighter italic">Cant.</th>
                      <th className="px-6 py-4 text-right font-black text-slate-900 uppercase tracking-tighter italic">Precio</th>
                      <th className="px-6 py-4 text-right font-black text-slate-900 uppercase tracking-tighter italic">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.detalles.map((det) => (
                      <tr key={det.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-800">{det.descripcion}</td>
                        <td className="px-6 py-5 text-center font-mono font-medium">{det.cantidad}</td>
                        <td className="px-6 py-5 text-right font-mono">${det.precio_unitario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-5 text-right font-black text-violet-600">${det.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-6 border-t border-slate-100">
            <div className="flex-1 max-w-sm">
              {data.notas && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={12} /> Observaciones</p>
                  <p className="text-xs text-slate-500 italic leading-relaxed">"{data.notas}"</p>
                </div>
              )}
            </div>
            
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between items-center px-4">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-900">${data.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-slate-900 rounded-[28px] p-6 text-white shadow-xl shadow-slate-200">
                <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Inversión Recomendada</span>
                      <span className="text-sm text-slate-400">Total presupuesto</span>
                   </div>
                   <span className="text-3xl font-black italic tracking-tighter">${data.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-500">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm italic">Dr. {data.especialista.nombre}</p>
                    <p className="text-xs text-slate-500">{data.especialista.email}</p>
                  </div>
                </div>
            </div>
            <div className="md:text-right text-xs text-slate-400">
              <p>Este presupuesto tiene fines informativos y su validez está sujeta a la fecha indicada.</p>
              <div className="flex items-center md:justify-end gap-2 grayscale mt-4 opacity-50">
                <ShieldCheck size={14} />
                <span className="font-black text-slate-600 tracking-tighter uppercase">OdontoFocus Ecosystem</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="max-w-4xl mx-auto mt-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] print:hidden">
        SaaS de Gestión Médica Profesional
      </div>
    </div>
  );
}
