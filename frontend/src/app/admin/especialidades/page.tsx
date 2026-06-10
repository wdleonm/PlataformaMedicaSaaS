"use client";

import { toast } from 'react-hot-toast';
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Stethoscope, 
  Search, 
  Filter, 
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
  X,
  Save,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Especialidad {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  created_at: string;
}

export default function AdminEspecialidadesPage() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEsp, setCurrentEsp] = useState<Partial<Especialidad>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);

  // Sugerencia automática de código
  useEffect(() => {
    if (!isEditing && currentEsp.nombre && !isCodeManuallyEdited) {
      const name = currentEsp.nombre.trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar acentos
      
      let suggestedCode = "";
      
      // Lógica de prefijos
      const isDental = ["ODONTOLOG", "ORTODON", "ENDODON", "MAXILO"].some(k => name.includes(k));
      const isMedical = name.includes("MEDICINA");
      
      if (isDental) {
        if (name.includes("GENERAL")) suggestedCode = "ODO_GEN";
        else if (name.includes("MAXILO")) suggestedCode = "ODO_MAX";
        else if (name.includes("ENDODON")) suggestedCode = "ODO_END";
        else if (name.includes("ORTODON")) suggestedCode = "ODO_ORT";
        else suggestedCode = `ODO_${name.substring(0, 3)}`;
      } else if (isMedical) {
        const parts = name.split(" ");
        const suffix = parts.length > 1 ? parts[1].substring(0, 3) : "GEN";
        suggestedCode = `MED_${suffix}`;
      } else {
        // Genérico: 3 primeras letras + _GEN
        suggestedCode = `${name.substring(0, 3)}_${name.length > 3 ? "GEN" : "001"}`;
      }
      
      setCurrentEsp(prev => ({ ...prev, codigo: suggestedCode }));
    }
  }, [currentEsp.nombre, isEditing, isCodeManuallyEdited]);

  const fetchEspecialidades = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/admin/config/especialidades");
      setEspecialidades(data);
    } catch (err) {
      console.error("Error loading specialties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setIsCodeManuallyEdited(false);
    setCurrentEsp({
      nombre: "",
      codigo: "",
      activo: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (esp: Especialidad) => {
    setIsEditing(true);
    setCurrentEsp(esp);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/api/admin/config/especialidades/${currentEsp.id}`, currentEsp);
      } else {
        await api.post("/api/admin/config/especialidades", currentEsp);
      }
      setIsModalOpen(false);
      fetchEspecialidades();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al guardar especialidad");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActivo = async (esp: Especialidad) => {
    try {
      await api.put(`/api/admin/config/especialidades/${esp.id}`, { ...esp, activo: !esp.activo });
      fetchEspecialidades();
    } catch (err) {
      toast.error("Error al actualizar estado");
    }
  };

  const filtered = especialidades.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Gestión de Especialidades</h1>
          <p className="text-on-surface-variant mt-1 font-medium italic underline decoration-violet-500/30">Configuración global de ramas médicas.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-violet-900/20 active:scale-95 transition-all text-sm"
        >
          <Plus size={18} /> Nueva Especialidad
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-violet-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-panel rounded-[2.5rem] py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-violet-500/40 outline-none transition-all placeholder:text-slate-600 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-container-low border border-slate-200 dark:border-violet-500/20 shadow-sm rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Nombre</th>
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Código</th>
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Estado</th>
                <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-violet-500 mx-auto" size={40} />
                    <p className="text-on-surface-variant mt-4 font-bold uppercase tracking-widest text-xs">Obteniendo registros...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">No se encontraron especialidades</p>
                  </td>
                </tr>
              ) : (
                filtered.map((esp, idx) => (
                  <motion.tr 
                    key={esp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-600/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-violet-700 dark:text-violet-400 font-bold">
                          <Stethoscope size={18} />
                        </div>
                        <span className="font-black text-on-surface text-sm group-hover:text-violet-400 transition-colors uppercase tracking-tight">{esp.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <Code size={14} />
                        <span className="text-xs font-mono font-bold">{esp.codigo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        esp.activo 
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" 
                          : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                      }`}>
                        {esp.activo ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                        {esp.activo ? "Activa" : "Inactiva"}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(esp)}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-slate-100 dark:hover:bg-surface-container-highest transition-all"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => toggleActivo(esp)}
                          className={`p-2.5 rounded-xl transition-all border ${
                            esp.activo 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" 
                              : "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/20"
                          }`}
                          title={esp.activo ? "Desactivar" : "Activar"}
                        >
                          {esp.activo ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#130b22] border border-slate-200 dark:border-outline-variant/30 rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-outline-variant/20 flex justify-between items-center bg-slate-50 dark:bg-surface-container-highest/50">
                <div>
                  <h3 className="text-2xl font-black text-on-surface italic tracking-tight">
                    {isEditing ? "Editar Especialidad" : "Nueva Especialidad"}
                  </h3>
                  <p className="text-violet-700 dark:text-violet-400/60 text-[10px] font-black uppercase tracking-widest mt-1">Configuración del Catálogo</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-highest/50 rounded-full text-on-surface-variant transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nombre de la Especialidad</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. Odontología General"
                    value={currentEsp.nombre || ""}
                    onChange={(e) => setCurrentEsp({...currentEsp, nombre: e.target.value})}
                    className="w-full glass-panel rounded-[2.5rem] p-4 text-on-surface focus:ring-2 focus:ring-violet-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Código Identificador (Sugerido: 3-6 letras)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej. ODO_GEN"
                    value={currentEsp.codigo || ""}
                    onChange={(e) => {
                      setIsCodeManuallyEdited(true);
                      setCurrentEsp({...currentEsp, codigo: e.target.value.toUpperCase()});
                    }}
                    className="w-full glass-panel rounded-[2.5rem] p-4 text-on-surface font-mono focus:ring-2 focus:ring-violet-500/50 outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-surface-container-highest/50 rounded-2xl border border-slate-200 dark:border-outline-variant/30">
                  <input 
                    type="checkbox" 
                    id="esp_activa"
                    checked={currentEsp.activo}
                    onChange={(e) => setCurrentEsp({...currentEsp, activo: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-200 dark:border-white/20 bg-white dark:bg-surface-container text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="esp_activa" className="text-sm font-bold text-on-surface cursor-pointer select-none tracking-tight">
                    Especialidad Activa (Visible para especialistas)
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 dark:border-outline-variant/30 text-on-surface-variant font-bold hover:bg-slate-100 dark:hover:bg-surface-container-highest/50 transition-all outline-none uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-lg shadow-violet-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group tracking-tight"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
