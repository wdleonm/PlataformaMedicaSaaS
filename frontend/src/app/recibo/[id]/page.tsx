"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  Share2, 
  Calendar, 
  CreditCard, 
  User, 
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  Info
} from "lucide-react";
import { motion } from "framer-motion";

interface ReceiptData {
  id: string;
  monto: number;
  fecha: string;
  metodo_pago: string;
  notas: string | null;
  paciente: {
    nombre: string;
    documento: string;
  };
  especialista: {
    nombre: string;
    email: string;
  };
  presupuesto: {
    total: number;
    saldo_pendiente: number;
    estado: string;
  };
}

export default function PublicReceiptPage() {
  const { id } = useParams();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const { data } = await api.get(`/api/public/recibo/${id}`);
        setData(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0514] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-violet-400 font-medium animate-pulse tracking-widest uppercase text-xs">Generando Recibo...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0a0514] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
        <Info className="text-red-400" size={40} />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Recibo no encontrado</h1>
      <p className="text-slate-400 max-w-sm mb-8">El enlace es inválido o el recibo ha sido eliminado del sistema.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-8 print:p-0 print:bg-white">
      {/* Botones de Acción (No imprimir) */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 print:shadow-none print:border-none"
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
                <span className="text-xl font-black tracking-tighter uppercase">OdontoFocus</span>
              </div>
              <h1 className="text-3xl font-black mb-1">Recibo de Abono</h1>
              <p className="text-slate-400 font-mono text-sm">Ref: {data.id.slice(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="text-right">
              <p className="text-violet-400 font-black uppercase tracking-widest text-[10px] mb-2">Estado del Pago</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={16} /> COMPLETADO
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-12">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información del Paciente</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-500">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{data.paciente.nombre}</p>
                    <p className="text-sm text-slate-500">CI/DNI: {data.paciente.documento}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Información del Especialista</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-500">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Dr. {data.especialista.nombre}</p>
                    <p className="text-sm text-slate-500">{data.especialista.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Money Box */}
          <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Recibido</p>
                <p className="text-3xl font-black text-slate-900">${data.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método de Pago</p>
                <div className="flex items-center gap-2 font-bold text-slate-700 mt-2 lowercase first-letter:uppercase">
                  <CreditCard size={18} className="text-violet-500" /> {data.metodo_pago.replace('_', ' ')}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha del Abono</p>
                <div className="flex items-center gap-2 font-bold text-slate-700 mt-2">
                  <Calendar size={18} className="text-violet-500" /> {new Date(data.fecha).toLocaleDateString()}
                </div>
              </div>
            </div>
            {/* Watermark Logo Icon */}
            <ShieldCheck size={120} className="absolute right-[-20px] bottom-[-20px] text-slate-200/50 rotate-[-15deg]" />
          </div>

          {/* Financial Summary */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Resumen del Presupuesto</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Total Presupuesto</span>
                <span className="font-bold text-slate-900">${data.presupuesto.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Total Abonado (este recibo)</span>
                <span className="font-bold text-emerald-600">-${data.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-100 rounded-xl text-violet-600">
                    <TrendingDown size={20} />
                  </div>
                  <span className="font-black text-slate-900 uppercase tracking-tight">Saldo Pendiente Restante</span>
                </div>
                <span className="text-2xl font-black text-violet-600">${data.presupuesto.saldo_pendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {data.notas && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
              <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-2">Observaciones</p>
              <p className="text-slate-600 text-sm italic italic">"{data.notas}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-8 md:p-12 text-center bg-slate-50/50">
          <p className="text-slate-400 text-xs mb-4">Este documento es una confirmación digital de pago válida para efectos informativos.</p>
          <div className="flex items-center justify-center gap-2 grayscale hover:grayscale-0 transition-all opacity-50">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <ShieldCheck className="text-white" size={14} />
            </div>
            <span className="font-black text-slate-600 text-sm tracking-tight">OdontoFocus SaaS</span>
          </div>
        </div>
      </motion.div>

      {/* Footer Info (No imprimir) */}
      <div className="max-w-3xl mx-auto mt-12 text-center text-slate-400 text-xs space-y-2 print:hidden">
        <p>¿Tienes dudas sobre tu pago? Contacta con el Dr. {data.especialista.nombre} directamente.</p>
        <div className="flex justify-center gap-6 pt-4">
          <button className="flex items-center gap-2 hover:text-slate-600 transition-colors uppercase font-black tracking-widest leading-none">
            <Share2 size={14} /> Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
