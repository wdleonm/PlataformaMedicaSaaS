"use client";

import { toast } from 'react-hot-toast';
import { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Activity,
  Save,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Edit2,
  X,
  Stethoscope,
  Download,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatLocalDate } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string | null;
  alergias: string | null;
  patologias_cronicas: string | null;
  medicacion_frecuente: string | null;
}

interface HistoriaClinicaAdjunto {
  id: string;
  nombre_archivo: string;
  tipo_mime: string;
}

interface HistoriaClinica {
  id: string;
  fecha_apertura: string;
  motivo_consulta: string;
  enfermedad_actual: string | null;
  antecedentes_familiares: any;
  antecedentes_personales: any;
  examen_clinico: any;
  estudios_complementarios: any;
  diagnostico: string | null;
  plan_tratamiento: string | null;
  actividades_realizadas: string | null;
  notas: string | null;
  adjuntos_count: number;
  adjuntos: HistoriaClinicaAdjunto[];
  created_at: string;
}

interface HCSeccion {
  id: string;
  codigo: string;
  nombre: string;
  componente_frontend: string;
  orden: number;
  obligatoria: boolean;
}

interface FormDataHistoria {
  fecha_apertura: string;
  motivo_consulta: string;
  enfermedad_actual: string;
  antecedentes_familiares: {
    madre: { viva: boolean; patologias: string[]; especifique?: string };
    padre: { viva: boolean; patologias: string[]; especifique?: string };
  };
  antecedentes_personales: {
    patologias: string[];
    especifique: string;
    medicamentos: string;
  };
  examen_clinico: {
    encias: string;
    carrillos: string;
    paladar_duro: string;
    lengua: string;
    paladar_blando: string;
    piso_boca: string;
    observaciones: string;
  };
  estudios_complementarios: {
    radiografias: string[];
    otro_radiografia?: string;
    observaciones: string;
    laboratorios: string;
  };
  diagnostico: string;
  plan_tratamiento: string;
  actividades_realizadas: string;
  notas: string;
  adjuntos: any[];
}

const formDataVacio = (): FormDataHistoria => ({
  fecha_apertura: new Date().toISOString().split("T")[0],
  motivo_consulta: "",
  enfermedad_actual: "",
  antecedentes_familiares: {
    madre: { viva: true, patologias: [], especifique: "" },
    padre: { viva: true, patologias: [], especifique: "" },
  },
  antecedentes_personales: { patologias: [], especifique: "", medicamentos: "" },
  examen_clinico: {
    encias: "", carrillos: "", paladar_duro: "", lengua: "",
    paladar_blando: "", piso_boca: "", observaciones: "",
  },
  estudios_complementarios: { radiografias: [], otro_radiografia: "", observaciones: "", laboratorios: "" },
  diagnostico: "",
  plan_tratamiento: "",
  actividades_realizadas: "",
  notas: "",
  adjuntos: [],
});

// ─── Secciones del modal (renderers estáticos mapeados por codigo) ────────────

const patologiasDisponibles = ["Alergias", "Cardiovascular", "Respiratorios", "Diabetes", "Sanguíneos", "Cáncer", "Otros"];
const personalesDisponibles = ["Cardiovasculares", "Enf. Pulmonar", "Sanguíneos", "Hemorrágicos", "Quirúrgicos", "Hospitalización", "Alergias", "Diabetes", "Convulsión", "Enf. Renal", "Asma", "Otros"];

function ConsultaStep({ formData, setFormData }: { formData: FormDataHistoria; setFormData: any }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Fecha de Atención</label>
          <input type="date" value={formData.fecha_apertura}
            onChange={(e) => setFormData({ ...formData, fecha_apertura: e.target.value })}
            className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none transition-all [color-scheme:dark]" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Motivo de Consulta *</label>
          <input required type="text" placeholder="Ej. Dolor agudo, Limpieza..." value={formData.motivo_consulta}
            onChange={(e) => setFormData({ ...formData, motivo_consulta: e.target.value })}
            className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none transition-all" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Enfermedad Actual / Descripción</label>
        <textarea rows={4} placeholder="Describa los síntomas, tiempo de evolución..."
          value={formData.enfermedad_actual}
          onChange={(e) => setFormData({ ...formData, enfermedad_actual: e.target.value })}
          className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none transition-all resize-none" />
      </div>
    </motion.div>
  );
}

function AntecedentesStep({ formData, setFormData }: { formData: FormDataHistoria; setFormData: any }) {
  const toggleFamiliar = (parent: "madre" | "padre", pat: string) => {
    setFormData((prev: FormDataHistoria) => {
      const current = prev.antecedentes_familiares[parent].patologias;
      const next = current.includes(pat) ? current.filter((p: string) => p !== pat) : [...current, pat];
      return { ...prev, antecedentes_familiares: { ...prev.antecedentes_familiares, [parent]: { ...prev.antecedentes_familiares[parent], patologias: next } } };
    });
  };
  const togglePersonal = (pat: string) => {
    setFormData((prev: FormDataHistoria) => {
      const current = prev.antecedentes_personales.patologias;
      const next = current.includes(pat) ? current.filter((p: string) => p !== pat) : [...current, pat];
      return { ...prev, antecedentes_personales: { ...prev.antecedentes_personales, patologias: next } };
    });
  };
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-bold border-b border-outline-variant/20 pb-2 flex items-center gap-2">
          <User size={18} className="text-primary" /> Antecedentes Familiares
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["madre", "padre"] as const).map((parent) => (
            <div key={parent} className="p-4 bg-surface-container-highest/20 rounded-2xl space-y-3">
              <p className="text-xs font-bold uppercase text-on-surface-variant capitalize">{parent}</p>
              <div className="flex flex-wrap gap-2">
                {patologiasDisponibles.map((p) => (
                  <button key={p} type="button" onClick={() => toggleFamiliar(parent, p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${formData.antecedentes_familiares[parent].patologias.includes(p) ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface-container-highest text-on-surface border border-outline-variant/20"}`}>
                    {p}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {formData.antecedentes_familiares[parent].patologias.includes("Otros") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <input 
                      type="text" 
                      placeholder={`Especifique otros de ${parent}...`}
                      value={formData.antecedentes_familiares[parent].especifique || ""}
                      onChange={(e) => setFormData({
                        ...formData, 
                        antecedentes_familiares: {
                          ...formData.antecedentes_familiares,
                          [parent]: { ...formData.antecedentes_familiares[parent], especifique: e.target.value }
                        }
                      })}
                      className="w-full bg-surface border border-outline-variant/50 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-primary outline-none mt-2" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-bold border-b border-outline-variant/20 pb-2">Antecedentes Personales Patológicos</h3>
        <div className="flex flex-wrap gap-2">
          {personalesDisponibles.map((p) => (
            <button key={p} type="button" onClick={() => togglePersonal(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${formData.antecedentes_personales.patologias.includes(p) ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface-container-highest text-on-surface border border-outline-variant/20"}`}>
              {p}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {(formData.antecedentes_personales.patologias.includes("Otros") || formData.antecedentes_personales.especifique) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 mt-4 overflow-hidden">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Especifique otros / observaciones</label>
                <input type="text" value={formData.antecedentes_personales.especifique}
                  onChange={(e) => setFormData({ ...formData, antecedentes_personales: { ...formData.antecedentes_personales, especifique: e.target.value } })}
                  className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-on-surface-variant">¿Toma algún medicamento?</label>
            <input type="text" value={formData.antecedentes_personales.medicamentos} placeholder="Nombre y dosis..."
              onChange={(e) => setFormData({ ...formData, antecedentes_personales: { ...formData.antecedentes_personales, medicamentos: e.target.value } })}
              className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ExamenFisicoStep({ formData, setFormData }: { formData: FormDataHistoria; setFormData: any }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <h3 className="font-bold border-b border-outline-variant/20 pb-2">Examen Clínico Intraoral</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(["encias", "carrillos", "paladar_duro", "lengua", "paladar_blando", "piso_boca"] as const).map((field) => (
          <div key={field} className="space-y-2">
            <label className="text-xs font-bold uppercase text-on-surface-variant">{field.replace("_", " ")}</label>
            <input type="text" value={(formData.examen_clinico as any)[field]} placeholder="Observación..."
              onChange={(e) => setFormData({ ...formData, examen_clinico: { ...formData.examen_clinico, [field]: e.target.value } })}
              className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-3 focus:ring-2 focus:ring-primary outline-none" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-on-surface-variant">Observaciones Generales y Hallazgos</label>
        <textarea rows={3} value={formData.examen_clinico.observaciones}
          onChange={(e) => setFormData({ ...formData, examen_clinico: { ...formData.examen_clinico, observaciones: e.target.value } })}
          className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none" />
      </div>
    </motion.div>
  );
}

function OdontogramaStep({ pacienteId }: { pacienteId: string | null }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div className="flex items-center justify-between border-b border-outline-variant/50 pb-3">
        <h3 className="font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/><path d="M12 8v4l3 3"/></svg>
          </span>
          Odontograma
        </h3>
        {pacienteId && (
          <a href={`/embed/odontograma?paciente_id=${pacienteId}`} target="_blank" rel="noopener noreferrer"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Abrir pantalla completa
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        )}
      </div>
      <div className="rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface/50">
        {pacienteId ? (
          <iframe src={`/embed/odontograma?paciente_id=${pacienteId}`}
            className="w-full h-[480px] border-0" title="Odontograma del paciente" />
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/></svg>
            <p className="text-sm font-medium">Selecciona un paciente primero</p>
          </div>
        )}
      </div>
      <p className="text-xs text-on-surface-variant text-center">
        Los registros del odontograma se guardan de forma independiente y se mantiene un historial evolutivo completo.
      </p>
    </motion.div>
  );
}

function PlanStep({ formData, setFormData }: { formData: FormDataHistoria; setFormData: any }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Diagnóstico</label>
          <textarea rows={4} value={formData.diagnostico} placeholder="Resumen del diagnóstico..."
            onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
            className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Plan de Tratamiento</label>
          <textarea rows={4} value={formData.plan_tratamiento} placeholder="Pasos a seguir..."
            onChange={(e) => setFormData({ ...formData, plan_tratamiento: e.target.value })}
            className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none" />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-bold border-b border-outline-variant/20 pb-2">Estudios Complementarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-on-surface-variant">Estudios Radiográficos</label>
            <div className="flex flex-wrap gap-2">
              {["Panorámica", "Periapical", "Interproximal", "Oclusal", "Tomografía", "Otro"].map((r) => (
                <button key={r} type="button"
                  onClick={() => {
                    const current = formData.estudios_complementarios.radiografias as string[];
                    const next = current.includes(r) ? current.filter((x) => x !== r) : [...current, r];
                    const updatedOtro = r === "Otro" && current.includes("Otro") ? "" : formData.estudios_complementarios.otro_radiografia || "";
                    setFormData({
                      ...formData,
                      estudios_complementarios: {
                        ...formData.estudios_complementarios,
                        radiografias: next,
                        otro_radiografia: updatedOtro
                      }
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${(formData.estudios_complementarios.radiografias as string[]).includes(r) ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface-container-highest border border-outline-variant/20"}`}>
                  {r}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {(formData.estudios_complementarios.radiografias as string[]).includes("Otro") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <input
                    type="text"
                    placeholder="Especifique otro estudio..."
                    value={formData.estudios_complementarios.otro_radiografia || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      estudios_complementarios: {
                        ...formData.estudios_complementarios,
                        otro_radiografia: e.target.value
                      }
                    })}
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-on-surface-variant">Exámenes de Laboratorio</label>
            <input type="text" value={formData.estudios_complementarios.laboratorios} placeholder="Resultados relevantes..."
              onChange={(e) => setFormData({ ...formData, estudios_complementarios: { ...formData.estudios_complementarios, laboratorios: e.target.value } })}
              className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-3 focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Notas Internas</label>
        <textarea rows={2} value={formData.notas} placeholder="Notas que no aparecen en el reporte impreso..."
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none" />
      </div>
    </motion.div>
  );
}

function ActividadesStep({ formData, setFormData }: { formData: FormDataHistoria; setFormData: any }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Actividades Realizadas / Evolución</label>
        <textarea rows={8} value={formData.actividades_realizadas} placeholder="Describa el procedimiento, tratamientos aplicados o evolución de hoy..."
          onChange={(e) => setFormData({ ...formData, actividades_realizadas: e.target.value })}
          className="w-full bg-surface border border-outline-variant/50 rounded-2xl p-4 focus:ring-2 focus:ring-primary outline-none resize-none" />
      </div>
    </motion.div>
  );
}

function AdjuntosStep({ historiaId, adjuntos, onUpdate }: { historiaId: string | null, adjuntos: any[], onUpdate: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adjuntoToDelete, setAdjuntoToDelete] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !historiaId) return;
    try {
      setIsUploading(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post(`/api/adjuntos/historia/${historiaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdate();
    } catch (error) {
      console.error("Error al subir archivo:", error);
      toast.error("No se pudo subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const eliminarAdjunto = (id: string) => {
    setAdjuntoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmEliminarAdjunto = async () => {
    if (!adjuntoToDelete) return;
    try {
      await api.delete(`/api/adjuntos/${adjuntoToDelete}`);
      onUpdate();
      setIsDeleteModalOpen(false);
      setAdjuntoToDelete(null);
    } catch (error) {
      console.error("Error al eliminar adjunto:", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
        <h3 className="font-bold flex items-center gap-2">Archivos y Documentos Adjuntos</h3>
        <label className={`cursor-pointer bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all ${!historiaId ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Plus size={14} /> Subir Archivo
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={!historiaId || isUploading} />
        </label>
      </div>

      {!historiaId && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-sm italic">
          Primero debes guardar la historia clínica para poder adjuntar documentos.
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
          <Loader2 size={16} className="animate-spin" /> Subiendo archivo...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adjuntos.map((adj) => (
          <div key={adj.id} className="p-4 glass-panel border border-outline-variant/20 rounded-2xl flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-surface-container-highest/50 rounded-lg text-on-surface-variant shrink-0">
                <FileText size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{adj.nombre_archivo}</p>
                <p className="text-[10px] text-on-surface-variant uppercase">{adj.tipo_mime.split('/')[1]}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/adjuntos/${adj.id}/download${token ? `?token=${token}` : ''}`} 
                target="_blank" rel="noopener noreferrer"
                className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                title="Ver en pestaña nueva">
                <ExternalLink size={16} />
              </a>
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/adjuntos/${adj.id}/download${token ? `?token=${token}&download=true` : '?download=true'}`} 
                className="p-2 hover:bg-success/20 text-success rounded-lg transition-colors"
                title="Descargar archivo">
                <Download size={16} />
              </a>
              <button onClick={() => eliminarAdjunto(adj.id)} className="p-2 hover:bg-error/20 text-error rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
        {adjuntos.length === 0 && !isUploading && (
          <div className="col-span-full py-12 text-center text-on-surface-variant border-2 border-dashed border-outline-variant/20 rounded-3xl">
            <p className="text-sm">No hay archivos adjuntos aún.</p>
          </div>
        )}
      </div>

      {/* Modal Confirmar Eliminación de Adjunto */}
      <AnimatePresence>
        {isDeleteModalOpen && adjuntoToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-background/50 backdrop-blur-[3px]" 
              onClick={() => setIsDeleteModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass-panel p-6 rounded-[2.5rem] border-none shadow-2xl flex flex-col text-center"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} />
              </div>
              <h3 className="text-xl font-black mb-2">¿Eliminar Archivo?</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Esta acción no se puede deshacer y el archivo se eliminará de la historia clínica.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setAdjuntoToDelete(null);
                  }}
                  className="flex-1 py-3 bg-surface-container-highest/50 text-on-surface-variant font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-surface-container-highest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmEliminarAdjunto}
                  className="flex-1 py-3 bg-error text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-error/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Renderizador dinámico: mapea codigo → componente React */
function renderSeccion(
  codigo: string,
  formData: FormDataHistoria,
  setFormData: any,
  pacienteId: string | null,
  historiaId: string | null,
  onUpdateAdjuntos: () => void
) {
  switch (codigo) {
    case "CONSULTA":
      return <ConsultaStep formData={formData} setFormData={setFormData} />;
    case "ANTECEDENTES":
      return <AntecedentesStep formData={formData} setFormData={setFormData} />;
    case "EXAMEN_FISICO":
      return <ExamenFisicoStep formData={formData} setFormData={setFormData} />;
    case "ODONTOGRAMA":
      return <OdontogramaStep pacienteId={pacienteId} />;
    case "PLAN":
      return <PlanStep formData={formData} setFormData={setFormData} />;
    case "ACTIVIDADES":
      return <ActividadesStep formData={formData} setFormData={setFormData} />;
    case "ADJUNTOS":
      return <AdjuntosStep historiaId={historiaId} adjuntos={formData.adjuntos} onUpdate={onUpdateAdjuntos} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant gap-3">
          <p className="text-sm font-medium">Componente &quot;{codigo}&quot; no implementado aún</p>
        </div>
      );
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

function HistoriasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const pacienteId = searchParams.get("paciente_id");
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [pacientesList, setPacientesList] = useState<Paciente[]>([]);
  const [secciones, setSecciones] = useState<HCSeccion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(false);
  const [isLoadingSecciones, setIsLoadingSecciones] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedHistoriaId, setSelectedHistoriaId] = useState<string | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0); // índice dentro de `secciones[]`
  const [formData, setFormData] = useState<FormDataHistoria>(formDataVacio());
  const [hasOdontogramaRecords, setHasOdontogramaRecords] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "ODONTOGRAMA_UPDATED" && pacienteId) {
        api.get(`/api/pacientes/${pacienteId}/odontograma`)
          .then(res => {
            setHasOdontogramaRecords(res.data?.dientes?.length > 0);
          })
          .catch(err => console.error(err));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pacienteId]);

  useEffect(() => {
    if (pacienteId && isModalOpen) {
      api.get(`/api/pacientes/${pacienteId}/odontograma`)
        .then(res => {
          setHasOdontogramaRecords(res.data?.dientes?.length > 0);
        })
        .catch(err => console.error(err));
    }
  }, [pacienteId, isModalOpen, currentStepIdx]);

  const filteredPacientes = pacientesList.filter((p) =>
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.documento && p.documento.includes(searchTerm))
  );

  // ── Carga de secciones desde la API ──────────────────────────────────────
  const filterSecciones = (seccionesList: any[]) => {
    const codigo = usuario?.especialidad_principal?.codigo?.toUpperCase() || "";
    const nombre = usuario?.especialidad_principal?.nombre?.toLowerCase() || "";
    
    // Identificar si es una especialidad dental (Odontología General, Cirugía Maxilofacial, Endodoncia, Ortodoncia)
    const isDental = 
      codigo.startsWith("ODO_") || 
      codigo.startsWith("ORT") ||
      nombre.includes("odontolog") || 
      nombre.includes("ortodoncia") || 
      nombre.includes("endodoncia") || 
      nombre.includes("maxilofacial");

    if (isDental) return seccionesList;

    // Si no es dental, eliminamos EXAMEN_FISICO, ODONTOGRAMA, PLAN por solicitud del usuario
    const excluded = ["EXAMEN_FISICO", "ODONTOGRAMA", "PLAN"];
    return seccionesList.filter((s) => !excluded.includes(s.codigo));
  };

  const fetchSecciones = async (especialidadId: string) => {
    try {
      setIsLoadingSecciones(true);
      const res = await api.get(`/api/hc-secciones/especialidad/${especialidadId}`);
      setSecciones(filterSecciones(res.data ?? []));
    } catch (err) {
      console.error("Error cargando secciones HC:", err);
      // Fallback: secciones hardcodeadas para no romper el flujo
      setSecciones(filterSecciones([
        { id: "1", codigo: "CONSULTA",      nombre: "Consulta Inicial", componente_frontend: "ConsultaStep",      orden: 1, obligatoria: true  },
        { id: "2", codigo: "ANTECEDENTES",  nombre: "Antecedentes",  componente_frontend: "AntecedentesStep",  orden: 2, obligatoria: false },
        { id: "3", codigo: "EXAMEN_FISICO", nombre: "Examen Físico", componente_frontend: "ExamenFisicoStep",  orden: 3, obligatoria: false },
        { id: "4", codigo: "ODONTOGRAMA",   nombre: "Odontograma",   componente_frontend: "OdontogramaStep",   orden: 4, obligatoria: false },
        { id: "5", codigo: "PLAN",          nombre: "Plan de Tratamiento", componente_frontend: "PlanStep",    orden: 5, obligatoria: false },
        { id: "6", codigo: "ACTIVIDADES",   nombre: "Actividades Realizadas", componente_frontend: "ActividadesStep", orden: 6, obligatoria: false },
        { id: "7", codigo: "ADJUNTOS",      nombre: "Adjuntos",      componente_frontend: "AdjuntosStep",      orden: 7, obligatoria: false },
      ]));
    } finally {
      setIsLoadingSecciones(false);
    }
  };

  // Cargar secciones cuando tengamos la especialidad del usuario
  useEffect(() => {
    if (usuario?.especialidad_principal?.id) {
      fetchSecciones(usuario.especialidad_principal.id);
    } else if (usuario && !usuario.especialidad_principal) {
      // usuario sin especialidad: usar fallback hardcodeado
      setSecciones(filterSecciones([
        { id: "1", codigo: "CONSULTA",      nombre: "Consulta Inicial", componente_frontend: "ConsultaStep",      orden: 1, obligatoria: true  },
        { id: "2", codigo: "ANTECEDENTES",  nombre: "Antecedentes",  componente_frontend: "AntecedentesStep",  orden: 2, obligatoria: false },
        { id: "3", codigo: "EXAMEN_FISICO", nombre: "Examen Físico", componente_frontend: "ExamenFisicoStep",  orden: 3, obligatoria: false },
        { id: "4", codigo: "ODONTOGRAMA",   nombre: "Odontograma",   componente_frontend: "OdontogramaStep",   orden: 4, obligatoria: false },
        { id: "5", codigo: "PLAN",          nombre: "Plan de Tratamiento", componente_frontend: "PlanStep",    orden: 5, obligatoria: false },
        { id: "6", codigo: "ACTIVIDADES",   nombre: "Actividades Realizadas", componente_frontend: "ActividadesStep", orden: 6, obligatoria: false },
        { id: "7", codigo: "ADJUNTOS",      nombre: "Adjuntos",      componente_frontend: "AdjuntosStep",      orden: 7, obligatoria: false },
      ]));
    }
  }, [usuario?.especialidad_principal?.id]);

  // ── Carga de datos de paciente e historias ────────────────────────────────
  const fetchPacientes = async () => {
    try {
      setIsLoadingPacientes(true);
      const res = await api.get("/api/pacientes");
      setPacientesList(res.data?.items || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoadingPacientes(false);
    }
  };

  const fetchData = async () => {
    if (!pacienteId) {
      fetchPacientes();
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg("");
      const pacRes = await api.get(`/api/pacientes/${pacienteId}`);
      setPaciente(pacRes.data);
      const histRes = await api.get(`/api/pacientes/${pacienteId}/historias`);
      setHistorias(histRes.data);
      try {
        const odontoRes = await api.get(`/api/pacientes/${pacienteId}/odontograma`);
        setHasOdontogramaRecords(odontoRes.data?.dientes?.length > 0);
      } catch (e) {
        console.error("Error loading initial odontograma state:", e);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMsg("No se pudieron cargar los datos del paciente o su historial.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [pacienteId]);

  // ── Abrir modales ─────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedHistoriaId(null);
    setCurrentStepIdx(0);
    
    const initialData = formDataVacio();
    
    // Pre-llenar con alertas globales del paciente si existen
    if (paciente) {
      const patologias: string[] = [];
      
      // 1. Si el paciente tiene alergias registradas, marcamos el botón "Alergias"
      if (paciente.alergias) {
        patologias.push("Alergias");
      }
      
      // 2. Si tiene patologías crónicas, intentamos mapearlas a los botones disponibles
      if (paciente.patologias_cronicas) {
        // Personales disponibles (copiamos la lógica para referencia o usamos la constante)
        const botonesDisponibles = ["Cardiovasculares", "Enf. Pulmonar", "Sanguíneos", "Hemorrágicos", "Quirúrgicos", "Hospitalización", "Alergias", "Diabetes", "Convulsión", "Enf. Renal", "Asma"];
        const actualPatologias = paciente.patologias_cronicas.toLowerCase();
        
        botonesDisponibles.forEach(btn => {
          if (actualPatologias.includes(btn.toLowerCase()) && !patologias.includes(btn)) {
            patologias.push(btn);
          }
        });
      }

      initialData.antecedentes_personales = {
        ...initialData.antecedentes_personales,
        patologias: patologias,
        especifique: [paciente.alergias, paciente.patologias_cronicas].filter(Boolean).join(" | "),
        medicamentos: paciente.medicacion_frecuente || ""
      };
    }
    
    setFormData(initialData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (h: HistoriaClinica) => {
    setModalMode("edit");
    setSelectedHistoriaId(h.id);
    setCurrentStepIdx(0);
    setFormData({
      fecha_apertura: h.fecha_apertura,
      motivo_consulta: h.motivo_consulta,
      enfermedad_actual: h.enfermedad_actual || "",
      antecedentes_familiares: h.antecedentes_familiares || { madre: { viva: true, patologias: [] }, padre: { viva: true, patologias: [] } },
      antecedentes_personales: h.antecedentes_personales || { patologias: [], especifique: "", medicamentos: "" },
      examen_clinico: h.examen_clinico || { encias: "", carrillos: "", paladar_duro: "", lengua: "", paladar_blando: "", piso_boca: "", observaciones: "" },
      estudios_complementarios: h.estudios_complementarios ? {
        radiografias: h.estudios_complementarios.radiografias || [],
        otro_radiografia: h.estudios_complementarios.otro_radiografia || "",
        observaciones: h.estudios_complementarios.observaciones || "",
        laboratorios: h.estudios_complementarios.laboratorios || "",
      } : { radiografias: [], otro_radiografia: "", observaciones: "", laboratorios: "" },
      diagnostico: h.diagnostico || "",
      plan_tratamiento: h.plan_tratamiento || "",
      actividades_realizadas: (h as any).actividades_realizadas || "",
      notas: h.notas || "",
      adjuntos: h.adjuntos || [],
    });
    setIsModalOpen(true);
  };

  // ── Guardar historia ──────────────────────────────────────────────────────
  const handleSaveHistoria = async (e?: React.FormEvent, stayOpen: boolean = false) => {
    if (e) e.preventDefault();
    if (!pacienteId) return;
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        paciente_id: pacienteId,
        especialidad_id: usuario?.especialidad_principal?.id ?? null,
      };
      
      if (modalMode === "create") {
        const res = await api.post("/api/historias-clinicas", payload);
        const newId = res.data.id;
        setSelectedHistoriaId(newId);
        setModalMode("edit"); // Cambiar a modo edición para guardados posteriores
      } else {
        await api.patch(`/api/historias-clinicas/${selectedHistoriaId}`, payload);
      }
      
      if (!stayOpen) {
        setIsModalOpen(false);
      }
      fetchData();
    } catch (error) {
      console.error("Error saving historia:", error);
      toast.error("Error al guardar la historia clínica.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // ── Copiar anterior ───────────────────────────────────────────────────────
  const handleCopyLastHistory = () => {
    if (historias.length === 0) return;
    const last = historias[0]; // La primera es la más reciente por el order_by desc
    setFormData({
      ...formData,
      motivo_consulta: last.motivo_consulta,
      enfermedad_actual: last.enfermedad_actual || "",
      antecedentes_familiares: last.antecedentes_familiares || formDataVacio().antecedentes_familiares,
      antecedentes_personales: last.antecedentes_personales || formDataVacio().antecedentes_personales,
      examen_clinico: last.examen_clinico || formDataVacio().examen_clinico,
      estudios_complementarios: last.estudios_complementarios ? {
        radiografias: last.estudios_complementarios.radiografias || [],
        otro_radiografia: last.estudios_complementarios.otro_radiografia || "",
        observaciones: last.estudios_complementarios.observaciones || "",
        laboratorios: last.estudios_complementarios.laboratorios || "",
      } : formDataVacio().estudios_complementarios,
      diagnostico: last.diagnostico || "",
      plan_tratamiento: last.plan_tratamiento || "",
      notas: last.notas || "",
      adjuntos: [], // No copiar adjuntos por seguridad
    });
  };

  // ── Estado de carga ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary mb-4" />
        <p className="text-on-surface-variant animate-pulse">Cargando...</p>
      </div>
    );
  }

  // ── Vista sin paciente seleccionado ───────────────────────────────────────
  if (!pacienteId) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Historias Clínicas</h1>
          <p className="text-on-surface-variant">Selecciona un paciente para gestionar su historial médico.</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
            <input type="text" placeholder="Buscar paciente por nombre o ID..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface/50 border border-outline-variant/50 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg" />
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingPacientes ? (
              <div className="py-12 text-center text-on-surface-variant">
                <Loader2 size={32} className="mx-auto animate-spin mb-4" /> Cargando lista de pacientes...
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant space-y-4">
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto"><User size={32} /></div>
                <p>No se encontraron pacientes que coincidan.</p>
              </div>
            ) : (
              filteredPacientes.map((p) => (
                <button key={p.id} onClick={() => router.push(`/historias?paciente_id=${p.id}`)}
                  className="flex items-center justify-between p-4 bg-surface/40 hover:bg-primary/10 border border-outline-variant/30 rounded-2xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                      {p.nombre[0]}{p.apellido[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-on-surface-variant">{p.documento || "Sin ID"}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-on-surface-variant group-hover:text-primary transition-all group-hover:translate-x-1" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Vista principal con historias del paciente ────────────────────────────
  const totalSecciones = secciones.length;
  const seccionActual = secciones[currentStepIdx];

  return (
    <div className="space-y-8">
      {/* Header & Back */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/pacientes")}
            className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historia Clínica</h1>
            <p className="text-on-surface-variant flex items-center gap-2 mt-1">
              <span className="font-semibold text-on-surface">{paciente?.nombre} {paciente?.apellido}</span>
              {paciente?.documento && <span className="text-xs bg-surface-container-highest px-2 py-0.5 rounded-full">ID: {paciente.documento}</span>}
            </p>
          </div>
        </div>
        <button onClick={handleOpenCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transform transition-all shadow-lg hover:shadow-primary/40 active:scale-95">
          <Plus size={18} /> Nueva Evolución
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-error/10 border border-destructive/20 text-error flex items-center gap-3">
          <AlertCircle size={20} /><p>{errorMsg}</p>
        </div>
      )}

      {/* Alertas Médicas Banners */}
      {(historias.length > 0 && (historias[0].antecedentes_personales?.patologias?.length > 0 || historias[0].antecedentes_personales?.especifique || paciente?.alergias || paciente?.medicacion_frecuente)) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2">
          {paciente?.alergias && (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500 shrink-0" size={16} />
              <span className="text-xs font-bold text-red-600">Alergias: {paciente.alergias}</span>
            </div>
          )}
          {historias[0].antecedentes_personales?.patologias?.filter((p:string) => p !== "Otros").map((pat: string) => (
            <div key={pat} className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
              <Activity className="text-amber-500 shrink-0" size={16} />
              <span className="text-xs font-bold text-amber-600">{pat}</span>
            </div>
          ))}
          {historias[0].antecedentes_personales?.especifique && (
            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
              <Activity className="text-amber-500 shrink-0" size={16} />
              <span className="text-xs font-bold text-amber-600">{historias[0].antecedentes_personales.especifique}</span>
            </div>
          )}
          {paciente?.medicacion_frecuente && (
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
              <Stethoscope className="text-blue-500 shrink-0" size={16} />
              <span className="text-xs font-bold text-blue-600">Medicación: {paciente.medicacion_frecuente}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative space-y-6">
        {historias.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant/50"><FileText size={32} /></div>
            <h3 className="text-xl font-bold">Sin registros clínicos</h3>
            <p className="text-on-surface-variant mt-2">Este paciente aún no tiene evoluciones registradas.</p>
            <button onClick={handleOpenCreateModal} className="mt-6 text-primary font-semibold hover:underline">
              Crear el primer registro ahora
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {historias.map((h, idx) => (
              <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-outline-variant/50 group">
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/20">
                  <div className="md:w-56 p-6 bg-surface-container-highest/20 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-2">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center gap-2">
                      <Stethoscope size={24} />
                      {h.adjuntos_count > 0 && (
                        <div className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-primary/20">
                          {h.adjuntos_count}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-lg">{format(formatLocalDate(h.fecha_apertura), "dd MMM, yyyy", { locale: es })}</div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-1">
                      <Clock size={12} /> {format(new Date(h.created_at), "HH:mm")}
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Motivo de Consulta</h4>
                        <p className="text-on-surface font-medium">{h.motivo_consulta}</p>
                      </div>
                      {h.enfermedad_actual && (
                        <div>
                          <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Enfermedad Actual</h4>
                          <p className="text-sm text-on-surface/80">{h.enfermedad_actual}</p>
                        </div>
                      )}
                    </div>
                    {h.diagnostico && (
                      <div className="pt-4 border-t border-outline-variant/10">
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Diagnóstico</h4>
                        <p className="text-sm text-on-surface/80 bg-surface/30 p-3 rounded-xl border border-outline-variant/10 italic">{h.diagnostico}</p>
                      </div>
                    )}
                    {h.plan_tratamiento && (
                      <div>
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Plan de Tratamiento</h4>
                        <p className="text-sm text-on-surface/80">{h.plan_tratamiento}</p>
                      </div>
                    )}
                    {h.actividades_realizadas && (
                      <div>
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Actividades Realizadas</h4>
                        <p className="text-sm text-on-surface/80">{h.actividades_realizadas}</p>
                      </div>
                    )}
                    {h.notas && (
                      <div className="pt-2">
                        <p className="text-xs text-on-surface-variant italic"><strong>Notas:</strong> {h.notas}</p>
                      </div>
                    )}
                    
                    {h.adjuntos && h.adjuntos.length > 0 && (
                      <div className="pt-4 border-t border-outline-variant/10">
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-1">
                          Adjuntos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {h.adjuntos.map((adj) => (
                            <div key={adj.id} className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest/30 border border-outline-variant/20 rounded-xl text-xs">
                              <FileText size={14} className="text-primary" />
                              <span className="font-medium truncate max-w-[150px]">{adj.nombre_archivo}</span>
                              <div className="flex items-center gap-2">
                                <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/adjuntos/${adj.id}/download${token ? `?token=${token}` : ''}`} 
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-0.5">
                                  <ExternalLink size={12} /> Ver
                                </a>
                                <span className="text-on-surface-variant/30">|</span>
                                <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/adjuntos/${adj.id}/download${token ? `?token=${token}&download=true` : '?download=true'}`} 
                                  className="text-success hover:underline flex items-center gap-0.5">
                                  <Download size={12} /> Descargar
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex md:flex-col justify-center md:justify-start gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container-highest/5">
                    <button onClick={() => handleOpenEditModal(h)}
                      className="p-3 hover:bg-primary/20 text-primary rounded-xl transition-all shadow-sm hover:scale-110"
                      title="Ver/Editar Detalle Completo">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal dinámico (Portal) ─────────────────────────────────────────── */}
      {typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/50 backdrop-blur-[3px]"
                onClick={() => !isSaving && setIsModalOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-panel w-full max-w-4xl rounded-[2.5rem] border-none shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh]">

                {/* Header del modal */}
                <div className="flex justify-between items-center p-6 border-b border-outline-variant/50 bg-surface-container-highest/30">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Stethoscope size={24} /></div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight">
                        {modalMode === "create" ? "Nueva Historia Clínica" : "Editar Historia Clínica"}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-on-surface-variant">
                          Paciente: {paciente?.nombre} {paciente?.apellido}
                        </p>
                        {usuario?.especialidad_principal && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {usuario.especialidad_principal.nombre}
                          </span>
                        )}
                        {modalMode === "create" && historias.length > 0 && (
                          <button type="button" onClick={handleCopyLastHistory}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-violet-600 transition-all shadow-sm active:scale-95 ml-2">
                            <Plus size={10} className="rotate-45" /> Copiar último registro
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)}
                    className="text-on-surface-variant hover:bg-surface-container-highest rounded-full p-1.5 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs de secciones — dinámicos desde API */}
                <div className="flex flex-wrap items-center px-6 py-3 bg-surface-container-highest/10 border-b border-outline-variant/20 gap-2">
                  {isLoadingSecciones ? (
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                      <Loader2 size={14} className="animate-spin" /> Cargando secciones...
                    </div>
                  ) : (() => {
                    const isStepComplete = (codigo: string) => {
                      if (!formData) return false;
                      switch (codigo) {
                        case "CONSULTA": return formData.motivo_consulta?.trim() !== "" || formData.enfermedad_actual?.trim() !== "";
                        case "ANTECEDENTES": return formData.antecedentes_personales?.patologias?.length > 0 || formData.antecedentes_personales?.medicamentos?.trim() !== "";
                        case "EXAMEN_FISICO": return formData.examen_clinico?.observaciones?.trim() !== "" || (formData.examen_clinico?.encias && formData.examen_clinico.encias !== "");
                        case "ODONTOGRAMA": return hasOdontogramaRecords;
                        case "PLAN": return formData.plan_tratamiento?.trim() !== "";
                        case "ACTIVIDADES": return formData.actividades_realizadas?.trim() !== "";
                        default: return false;
                      }
                    };
                    return secciones.map((s, idx) => {
                      const completed = isStepComplete(s.codigo);
                      const isActive = currentStepIdx === idx;
                      
                      let btnClasses = "";
                      let spanClasses = "";
                      
                      if (completed) {
                        if (isActive) {
                          btnClasses = "bg-green-500/20 text-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] scale-105";
                          spanClasses = "border-green-500";
                        } else {
                          btnClasses = "bg-green-500/10 text-green-500 border-green-500/30";
                          spanClasses = "border-green-500";
                        }
                      } else {
                        if (isActive) {
                          btnClasses = "bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(77,158,170,0.2)] scale-105";
                          spanClasses = "border-primary";
                        } else {
                          btnClasses = "bg-surface border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest hover:border-outline-variant/50";
                          spanClasses = "border-current";
                        }
                      }

                      return (
                        <button key={s.id} type="button" onClick={() => setCurrentStepIdx(idx)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${btnClasses}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${spanClasses}`}>
                            {completed ? <CheckCircle2 size={10} /> : idx + 1}
                          </span>
                          {s.nombre}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Contenido del paso actual */}
                <form onSubmit={handleSaveHistoria} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {seccionActual
                    ? renderSeccion(
                        seccionActual.codigo, 
                        formData, 
                        setFormData, 
                        pacienteId, 
                        selectedHistoriaId,
                        () => {
                          if (selectedHistoriaId) {
                            api.get(`/api/adjuntos/historia/${selectedHistoriaId}`).then(res => {
                              setFormData(prev => ({ ...prev, adjuntos: res.data || [] }));
                            });
                          }
                        }
                      )
                    : (
                      <div className="flex items-center justify-center h-48 text-on-surface-variant">
                        <Loader2 size={32} className="animate-spin" />
                      </div>
                    )
                  }
                </form>

                {/* Footer de navegación */}
                <div className="p-6 border-t border-outline-variant/50 bg-surface-container-highest/30 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <button type="button"
                      onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))}
                      disabled={currentStepIdx === 0 || isSaving}
                      className="px-6 py-2.5 text-sm font-bold bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-2xl transition-all disabled:opacity-0">
                      Anterior
                    </button>
                    <p className="text-[11px] text-on-surface-variant italic"><span className="text-primary font-bold not-italic">*</span> Campos obligatorios</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                      className="px-6 py-2.5 text-sm font-medium hover:text-primary transition-colors disabled:opacity-50 px-5 py-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-highest transition-colors">
                      Cancelar
                    </button>
                    
                    {currentStepIdx < totalSecciones - 1 ? (
                      <>
                        <button type="button"
                          onClick={(e) => handleSaveHistoria(e, true)}
                          disabled={isSaving}
                          className="bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface text-sm font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2">
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Guardar Avance</>}
                        </button>
                        <button type="button"
                          onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-8 py-3 rounded-2xl transition-all shadow-lg active:scale-95">
                          Siguiente
                        </button>
                      </>
                    ) : (
                      <button type="submit" disabled={isSaving} onClick={(e) => handleSaveHistoria(e, false)}
                        className="bg-success hover:bg-success/90 text-success-foreground text-sm font-black px-10 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-xl hover:shadow-success/30 active:scale-95 disabled:opacity-75">
                        {isSaving ? <><Loader2 size={18} className="animate-spin" /> Guardando</> : <><Save size={18} /> Finalizar y Guardar</>}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default function HistoriasPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary mb-4" />
        <p className="text-on-surface-variant">Cargando...</p>
      </div>
    }>
      <HistoriasContent />
    </Suspense>
  );
}
