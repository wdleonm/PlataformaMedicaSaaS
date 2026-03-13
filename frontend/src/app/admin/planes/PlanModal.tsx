"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Shield, Star, Users, Calendar, DollarSign, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  precio_mensual: number;
  max_pacientes: number | null;
  max_citas_mes: number | null;
  incluye_whatsapp: boolean;
  incluye_multiusuario: boolean;
  soporte_prioritario: boolean;
  activo: boolean;
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
  onSuccess: () => void;
}

export default function PlanModal({ isOpen, onClose, plan, onSuccess }: PlanModalProps) {
  const [formData, setFormData] = useState<Partial<Plan>>({
    codigo: "",
    nombre: "",
    precio_mensual: 0,
    max_pacientes: null,
    max_citas_mes: null,
    incluye_whatsapp: false,
    incluye_multiusuario: false,
    soporte_prioritario: false,
    activo: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData({
        codigo: "",
        nombre: "",
        precio_mensual: 0,
        max_pacientes: null,
        max_citas_mes: null,
        incluye_whatsapp: false,
        incluye_multiusuario: false,
        soporte_prioritario: false,
        activo: true,
      });
    }
    setError(null);
  }, [plan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (plan?.id) {
        await api.put(`/api/admin/planes/${plan.id}`, formData);
      } else {
        await api.post("/api/admin/planes/", formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Error al guardar el plan. Verifica los datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: value === "" ? null : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0514] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Shield className="text-violet-500" />
              {plan ? "Editar Plan de Suscripción" : "Crear Nuevo Plan"}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <form id="planForm" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Código del Plan</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo || ""}
                    onChange={handleChange}
                    disabled={!!plan}
                    placeholder="ej: basico, profesional"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    required
                  />
                  {!plan && <p className="text-xs text-slate-500">Debe ser único y sin espacios.</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Nombre Visible</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ""}
                    onChange={handleChange}
                    placeholder="ej: Plan Básico"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 flex justify-between">
                    <span>Precio Mensual ($)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <DollarSign size={18} />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      name="precio_mensual"
                      value={formData.precio_mensual === undefined ? "" : formData.precio_mensual}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 flex items-center">
                  <div className="flex items-center mt-6">
                    <label className="relative flex items-center p-3 rounded-full cursor-pointer">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={formData.activo || false}
                        onChange={handleChange}
                        className="before:content[''] peer relative h-6 w-6 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-violet-500 before:opacity-0 before:transition-opacity checked:border-violet-500 checked:bg-violet-500 checked:before:bg-violet-500 hover:before:opacity-10"
                      />
                      <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </span>
                    </label>
                    <span className="font-bold text-white ml-2">Plan Activo</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <Star className="text-yellow-500" size={18} />
                  Límites y Características
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <Users size={16} className="text-slate-400" />
                      Máximo Pacientes
                    </label>
                    <input
                      type="number"
                      name="max_pacientes"
                      value={formData.max_pacientes || ""}
                      onChange={handleChange}
                      placeholder="Dejar vacío para ilimitado"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      Citas Mensuales
                    </label>
                    <input
                      type="number"
                      name="max_citas_mes"
                      value={formData.max_citas_mes || ""}
                      onChange={handleChange}
                      placeholder="Dejar vacío para ilimitadas"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <label className="flex items-center gap-4 cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        name="incluye_whatsapp"
                        checked={formData.incluye_whatsapp || false}
                        onChange={handleChange}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:border-emerald-500 checked:bg-emerald-500 transition-all"
                      />
                      <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <MessageCircle size={16} className="text-emerald-400" />
                        Alertas y Recordatorios por WhatsApp
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Permite automatización de mensajes</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        name="incluye_multiusuario"
                        checked={formData.incluye_multiusuario || false}
                        onChange={handleChange}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:border-violet-500 checked:bg-violet-500 transition-all"
                      />
                      <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Users size={16} className="text-violet-400" />
                        Acceso Multi-Usuario
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Permite asistentes y secretarias</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        name="soporte_prioritario"
                        checked={formData.soporte_prioritario || false}
                        onChange={handleChange}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 checked:border-amber-500 checked:bg-amber-500 transition-all"
                      />
                      <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 peer-checked:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Star size={16} className="text-amber-400" />
                        Soporte Prioritario 24/7
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Asistencia técnica y respuesta rápida en todo momento</div>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 font-bold text-slate-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="planForm"
              disabled={isSubmitting}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {plan ? "Guardar Cambios" : "Crear Plan"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
