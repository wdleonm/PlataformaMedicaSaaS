"use client";

import { toast } from 'react-hot-toast';
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Settings, 
  Stethoscope, 
  Layers, 
  Globe, 
  Plus, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Save, 
  X,
  Dna,
  Coins,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Especialidad {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
}

interface Hallazgo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion_visual: string;
  activo: boolean;
  orden: number;
}

interface GlobalConfig {
  id: string;
  moneda_nombre: string;
  moneda_simbolo: string;
  tasa_usd: number;
  tasa_eur: number;
  iva_porcentaje: number;
  bcv_modo_automatico: boolean;
  bcv_ultima_sincronizacion: string | null;
  ycloud_api_key?: string;
  ycloud_whatsapp_number?: string;
}

export default function AdminConfigPage() {
  const [activeTab, setActiveTab] = useState<"especialidades" | "hallazgos" | "global" | "admins">("especialidades");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"especialidad" | "hallazgo">("especialidad");
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [respEsp, respHal, respConf, respAdmins] = await Promise.all([
        api.get("/api/admin/config/especialidades"),
        api.get("/api/admin/config/hallazgos"),
        api.get("/api/admin/config/global"),
        api.get("/api/admin/users/")
      ]);
      setEspecialidades(respEsp.data);
      setHallazgos(respHal.data);
      setConfig(respConf.data);
      setAdmins(respAdmins.data);
    } catch (err: any) {
      console.error("Error loading config data:", err);
      setError("No se pudo conectar con el servidor. Verifique que el backend esté corriendo en el puerto 8001.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncBCV = async () => {
    setIsSyncing(true);
    try {
      const { data } = await api.post("/api/admin/config/global/sync-bcv");
      setConfig(data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al sincronizar con BCV");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveGlobal = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const { data } = await api.patch("/api/admin/config/global", config);
      setConfig(data);
      toast.success("Configuración guardada con éxito");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateEsp = () => {
    setIsEditing(false);
    setModalType("especialidad");
    setCurrentEntity({ nombre: "", codigo: "", activo: true });
    setIsModalOpen(true);
  };

  const handleOpenEditEsp = (esp: Especialidad) => {
    setIsEditing(true);
    setModalType("especialidad");
    setCurrentEntity(esp);
    setIsModalOpen(true);
  };

  const handleOpenCreateHal = () => {
    setIsEditing(false);
    setModalType("hallazgo");
    setCurrentEntity({ codigo: "", nombre: "", categoria: "patologia", descripcion_visual: "", activo: true, orden: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditHal = (hal: Hallazgo) => {
    setIsEditing(true);
    setModalType("hallazgo");
    setCurrentEntity(hal);
    setIsModalOpen(true);
  };

  const handleOpenCreateAdmin = () => {
    setIsEditing(false);
    setModalType("admin_user" as any);
    setCurrentEntity({ nombre: "", apellido: "", email: "", password: "", rol: "master", activo: true });
    setIsModalOpen(true);
  };

  const handleOpenEditAdmin = (admin: any) => {
    setIsEditing(true);
    setModalType("admin_user" as any);
    setCurrentEntity({ ...admin, password: "" }); // Password vacía para no sobrescribir si no se edita
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalType === "especialidad") {
        if (isEditing) {
          await api.put(`/api/admin/config/especialidades/${currentEntity.id}`, currentEntity);
        } else {
          await api.post("/api/admin/config/especialidades", currentEntity);
        }
      } else if (modalType === "hallazgo") {
        if (isEditing) {
          await api.put(`/api/admin/config/hallazgos/${currentEntity.id}`, currentEntity);
        } else {
          await api.post("/api/admin/config/hallazgos", currentEntity);
        }
      } else if (modalType as any === "admin_user") {
        if (isEditing) {
          await api.patch(`/api/admin/users/${currentEntity.id}`, currentEntity);
        } else {
          await api.post("/api/admin/users/", currentEntity);
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border ${
        activeTab === id 
          ? "bg-violet-600 text-white border-transparent shadow-lg shadow-violet-900/40" 
          : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-on-surface tracking-tight">Configuración Global</h1>
        <p className="text-on-surface-variant mt-1 font-medium italic underline decoration-slate-500/30">Control maestro de catálogos y parámetros del sistema SaaS.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex flex-wrap gap-4">
        <TabButton id="especialidades" icon={Stethoscope} label="Especialidades Médicas" />
        <TabButton id="hallazgos" icon={Dna} label="Catálogo Odontograma" />
        <TabButton id="global" icon={Globe} label="Ajustes Plataforma" />
        <TabButton id="admins" icon={ShieldCheck} label="Gestión de Equipo" />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-4"
        >
          <p className="text-red-400 text-sm font-bold">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Reintentar
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* TAB ESPECIALIDADES */}
        {activeTab === "especialidades" && (
          <motion.div 
            key="especialidades"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20">
                  <Stethoscope className="text-violet-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-on-surface italic">Ramas Médicas</h2>
                  <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Registradas en el ecosistema</p>
                </div>
              </div>
              <button 
                onClick={handleOpenCreateEsp}
                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-500/30 text-slate-700 dark:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-sm shadow-sm dark:shadow-none"
              >
                <Plus size={18} /> Nueva Especialidad
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center">
                  <Loader2 className="animate-spin text-violet-500" size={40} />
                </div>
              ) : especialidades.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">No hay especialidades registradas</p>
                </div>
              ) : (
                especialidades.map((esp) => (
                  <motion.div 
                    key={esp.id}
                    layoutId={esp.id}
                    className="p-6 bg-white dark:bg-[#0b1c30]/50 border border-slate-200 dark:border-outline-variant/20 rounded-[2rem] group hover:border-violet-500/30 transition-all flex flex-col justify-between shadow-sm dark:shadow-2xl"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          esp.activo ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        }`}>
                          {esp.activo ? "Activa" : "Inactiva"}
                        </div>
                        <button 
                          onClick={() => handleOpenEditEsp(esp)}
                          className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                      <h3 className="text-lg font-black text-on-surface group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{esp.nombre}</h3>
                      <p className="text-xs font-mono text-on-surface-variant font-bold uppercase tracking-tighter mt-1">{esp.codigo}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {['CONSULTA', 'ANTECEDENTES', 'EXAMEN_FISICO', 'PLAN'].map(sec => (
                        <span key={sec} className="text-[8px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/10 dark:border-violet-500/10 font-black">
                          {sec.replace('_', ' ')}
                        </span>
                      ))}
                      {esp.codigo.includes('ODONTO') && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10 dark:border-emerald-500/10 font-black">
                          ODONTOGRAMA
                        </span>
                      )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-outline-variant/20 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-600">ID: {esp.id.slice(0,8)}...</span>
                      <ChevronRight className="text-slate-400 dark:text-slate-700 group-hover:translate-x-1 transition-transform" size={16} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* TAB HALLAZGOS ODONTOGRAMA */}
        {activeTab === "hallazgos" && (
          <motion.div 
            key="hallazgos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20">
                  <Dna className="text-violet-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-on-surface italic">Catálogo de Hallazgos</h2>
                  <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Iconografía y patologías del odontograma</p>
                </div>
              </div>
              <button 
                onClick={handleOpenCreateHal}
                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-500/30 text-slate-700 dark:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-sm shadow-sm dark:shadow-none"
              >
                <Plus size={18} /> Nuevo Hallazgo
              </button>
            </div>

            <div className="bg-white dark:bg-[#0b1c30]/50 border border-slate-200 dark:border-outline-variant/20 rounded-[2rem] shadow-sm dark:shadow-2xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-surface-container-highest/50 border-b border-slate-200 dark:border-outline-variant/20">
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400/80">Orden/Ref</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400/80">Hallazgo</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400/80">Categoría</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400/80">Visualización</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-400/80 italic">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <Loader2 className="animate-spin text-violet-500 mx-auto" size={32} />
                      </td>
                    </tr>
                  ) : hallazgos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center">
                        <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Catálogo vacío</p>
                      </td>
                    </tr>
                  ) : (
                    hallazgos.map((hal) => (
                      <tr key={hal.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-600">#{hal.orden}</span>
                            <span className="text-xs font-mono font-bold text-on-surface bg-slate-100 dark:bg-surface-container-highest/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-outline-variant/20">{hal.codigo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-on-surface text-sm uppercase tracking-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{hal.nombre}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            hal.categoria === 'patologia' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                            hal.categoria === 'restauracion' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                            'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}>
                            {hal.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-on-surface-variant font-medium italic leading-none">{hal.descripcion_visual || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <div className={`w-2 h-2 rounded-full ${hal.activo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 opacity-50'}`} />
                            <button 
                              onClick={() => handleOpenEditHal(hal)}
                              className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* TAB AJUSTES GLOBALES */}
        {activeTab === "global" && (
          <motion.div 
            key="global"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="p-8 bg-white dark:bg-[#0b1c30]/50 border border-slate-200 dark:border-outline-variant/20 rounded-[2rem] shadow-sm dark:shadow-2xl space-y-8 relative overflow-hidden group hover:border-violet-500/20 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-[80px] group-hover:bg-violet-600/10 transition-colors pointer-events-none" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20">
                    <Coins className="text-violet-500" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-on-surface italic">Finanzas y Moneda</h2>
                    <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Base impositiva y contable</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={handleSyncBCV}
                    disabled={isSyncing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/40 active:scale-95"
                  >
                    {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <Globe size={14} />}
                    Sincronizar BCV ahora
                  </button>
                  {config?.bcv_ultima_sincronizacion && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <p className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter">
                        Sincronizado: {new Date(config.bcv_ultima_sincronizacion).toLocaleString('es-VE', { timeZone: 'America/Caracas', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Moneda Local (Símbolo)</label>
                    <input 
                      type="text" 
                      value={config?.moneda_simbolo || ""} 
                      onChange={(e) => setConfig(config ? {...config, moneda_simbolo: e.target.value} : null)}
                      className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-bold transition-all shadow-sm dark:shadow-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">IVA Predeterminado (%)</label>
                    <input 
                      type="number" 
                      value={config?.iva_porcentaje || 0} 
                      onChange={(e) => setConfig(config ? {...config, iva_porcentaje: parseFloat(e.target.value)} : null)}
                      className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-bold transition-all shadow-sm dark:shadow-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0d1b2e] p-6 rounded-3xl border border-indigo-500/20">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1 flex items-center gap-2">
                        <Globe size={12} /> Tasa EUR (Referencia Principal Bs)
                      </label>
                      <input 
                        type="number" step="0.0001"
                        value={config?.tasa_eur || 0} 
                        onChange={(e) => setConfig(config ? {...config, tasa_eur: parseFloat(e.target.value)} : null)}
                        className="w-full bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-4 text-white font-black text-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                      />
                      <p className="text-[9px] text-slate-400 font-bold italic ml-1">Esta tasa se usará para convertir montos de $ a Bs automáticamente.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tasa USD (Informativa)</label>
                      <input 
                        type="number" step="0.0001"
                        value={config?.tasa_usd || 0} 
                        onChange={(e) => setConfig(config ? {...config, tasa_usd: parseFloat(e.target.value)} : null)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black text-xl focus:ring-2 focus:ring-violet-500/50 outline-none transition-all" 
                      />
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-start gap-3">
                  <div className="mt-1 p-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 font-bold leading-relaxed">
                    Motor Financiero: Los precios base en Dólares ($) se multiplicarán por la <span className="text-on-surface italic underline">Tasa Euro</span> para determinar el cobro final en Bolívares (Bs.). La tasa USD se mantiene como referencia comparativa.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-[#0b1c30]/50 border border-slate-200 dark:border-outline-variant/20 rounded-[2rem] shadow-sm dark:shadow-2xl space-y-8 relative overflow-hidden group hover:border-violet-500/20 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-[80px] group-hover:bg-violet-600/10 transition-colors pointer-events-none" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20">
                  <ShieldCheck className="text-violet-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-on-surface italic">Llaves de API (Seguridad)</h2>
                  <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Conexiones a servicios externos</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">YCloud API Key (WhatsApp)</label>
                  <input 
                    type="password" 
                    placeholder="Escriba nueva key para actualizar..."
                    onChange={(e) => setConfig(config ? {...config, ycloud_api_key: e.target.value} : null)}
                    className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-mono tracking-widest transition-all shadow-sm dark:shadow-none" 
                  />
                </div>
                <div className="p-4 bg-violet-50 dark:bg-violet-600/5 border border-violet-100 dark:border-violet-500/20 rounded-2xl flex items-center gap-4">
                  <span className="text-xs text-violet-700 dark:text-violet-400 font-bold italic">La llave se guarda encriptada. Solo ingrésela si desea cambiarla.</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Origen WhatsApp (E.164)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 584141234567 (sin +)"
                    value={config?.ycloud_whatsapp_number || ""}
                    onChange={(e) => setConfig(config ? {...config, ycloud_whatsapp_number: e.target.value} : null)}
                    className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-mono transition-all shadow-sm dark:shadow-none" 
                  />
                </div>
              </div>
            </div>
            
            <div className="col-span-full flex justify-end">
                <button 
                  onClick={handleSaveGlobal}
                  disabled={isSaving}
                  className="bg-violet-600 text-white font-black px-10 py-4 rounded-2xl shadow-lg shadow-violet-500/20 dark:shadow-violet-900/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center gap-3"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Guardar Configuración Maestra
                </button>
            </div>
          </motion.div>
        )}

        {/* TAB GESTIÓN DE EQUIPO ADMIN */}
        {activeTab === "admins" && (
          <motion.div 
            key="admins"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                  <ShieldCheck className="text-indigo-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-on-surface italic">Usuarios con Acceso Master</h2>
                  <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Personal administrativo de la plataforma SaaS</p>
                </div>
              </div>
              <button 
                onClick={handleOpenCreateAdmin}
                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-500/30 text-slate-700 dark:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 text-sm shadow-sm dark:shadow-none"
              >
                <Plus size={18} /> Nuevo Administrador
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center">
                  <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
              ) : admins.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">No hay administradores registrados</p>
                </div>
              ) : (
                admins.map((admin) => (
                  <motion.div 
                    key={admin.id}
                    className="p-6 bg-white dark:bg-[#0b1c30]/50 border border-slate-200 dark:border-outline-variant/20 rounded-[2rem] group hover:border-indigo-500/30 transition-all flex flex-col justify-between relative overflow-hidden shadow-sm dark:shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          admin.rol === 'master' ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                        }`}>
                          {admin.rol}
                        </div>
                        <button 
                          onClick={() => handleOpenEditAdmin(admin)}
                          className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                      <h3 className="text-lg font-black text-on-surface group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                        {admin.nombre} {admin.apellido}
                      </h3>
                      <p className="text-xs text-on-surface-variant font-bold mt-1">{admin.email}</p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-outline-variant/20 flex items-center justify-between relative z-10">
                       <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${admin.activo ? 'text-emerald-500' : 'text-red-500'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${admin.activo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                         {admin.activo ? 'Activado' : 'Inactivo'}
                       </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CRUD */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#0f0a1a] border border-slate-200 dark:border-outline-variant/30 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
               <div className="p-8 border-b border-slate-100 dark:border-outline-variant/20 flex justify-between items-center bg-slate-50 dark:bg-surface-container-highest/50">
                <div>
                  <h3 className="text-2xl font-black text-on-surface italic tracking-tight uppercase">
                    {isEditing ? `Editar ${modalType}` : `Nuevo ${modalType}`}
                  </h3>
                  <p className="text-violet-600/60 dark:text-violet-400/60 text-[10px] font-black uppercase tracking-widest mt-1">Actualización de Estructura Maestra</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200/50 dark:hover:bg-surface-container-highest/50 rounded-full text-on-surface-variant transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {modalType === "especialidad" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nombre de la Especialidad</label>
                      <input 
                        type="text" 
                        required
                        value={currentEntity.nombre || ""}
                        onChange={(e) => setCurrentEntity({...currentEntity, nombre: e.target.value})}
                        className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none"
                        placeholder="Ej: Odontología, Cardiología..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Código Único (Ref)</label>
                      <input 
                        type="text" 
                        required
                        disabled={isEditing}
                        value={currentEntity.codigo || ""}
                        onChange={(e) => setCurrentEntity({...currentEntity, codigo: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                        className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-mono tracking-widest transition-all shadow-sm dark:shadow-none uppercase disabled:opacity-50"
                        placeholder="ODO_GEN"
                      />
                    </div>
                  </>
                ) : modalType === "hallazgo" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nombre</label>
                        <input 
                          type="text" required
                          value={currentEntity.nombre || ""}
                          onChange={(e) => setCurrentEntity({...currentEntity, nombre: e.target.value})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Código</label>
                        <input 
                          type="text" required disabled={isEditing}
                          value={currentEntity.codigo || ""}
                          onChange={(e) => setCurrentEntity({...currentEntity, codigo: e.target.value.toUpperCase()})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-mono transition-all shadow-sm dark:shadow-none text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Categoría</label>
                        <select 
                          value={currentEntity.categoria || ""}
                          onChange={(e) => setCurrentEntity({...currentEntity, categoria: e.target.value})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium transition-all shadow-sm dark:shadow-none text-sm appearance-none"
                        >
                          <option value="patologia">Patología</option>
                          <option value="restauracion">Restauración</option>
                          <option value="estado">Estado</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Orden Visual</label>
                        <input 
                          type="number" required
                          value={currentEntity.orden || 0}
                          onChange={(e) => setCurrentEntity({...currentEntity, orden: parseInt(e.target.value)})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Descripción Visual (CSS/Color)</label>
                      <input 
                        type="text"
                        value={currentEntity.descripcion_visual || ""}
                        onChange={(e) => setCurrentEntity({...currentEntity, descripcion_visual: e.target.value})}
                        className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none text-sm italic"
                        placeholder="Ej: Mancha roja, Área azul..."
                      />
                    </div>
                  </>
                ) : (modalType as any) === "admin_user" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nombre</label>
                        <input 
                          type="text" required
                          value={currentEntity.nombre || ""}
                          onChange={(e) => setCurrentEntity({...currentEntity, nombre: e.target.value})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Apellido</label>
                        <input 
                          type="text" required
                          value={currentEntity.apellido || ""}
                          onChange={(e) => setCurrentEntity({...currentEntity, apellido: e.target.value})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Correo Electrónico</label>
                        <input 
                          type="email" required
                          value={currentEntity.email || ""}
                          onChange={(e) => setCurrentEntity({...currentEntity, email: e.target.value})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Contraseña</label>
                        <input 
                          type="password" 
                          placeholder={isEditing ? "Dejar en blanco para no cambiar" : "Mínimo 8 caracteres"}
                          required={!isEditing}
                          value={currentEntity.password || ""}
                          onChange={(e) => setCurrentEntity({...currentEntity, password: e.target.value})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-slate-600 font-medium transition-all shadow-sm dark:shadow-none text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Nivel de Acceso (Rol)</label>
                        <select 
                          value={currentEntity.rol || "master"}
                          onChange={(e) => setCurrentEntity({...currentEntity, rol: e.target.value})}
                          className="w-full bg-white dark:bg-surface-container-highest/50 border border-slate-200 dark:border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-medium transition-all shadow-sm dark:shadow-none text-sm appearance-none"
                        >
                          <option value="master">Master Admin (Acceso Total)</option>
                          <option value="solo_lectura">Solo Lectura (Soporte)</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-surface-container-highest/50 rounded-2xl border border-slate-200 dark:border-outline-variant/30">
                  <input 
                    type="checkbox" 
                    id="entity_activo"
                    checked={currentEntity.activo}
                    onChange={(e) => setCurrentEntity({...currentEntity, activo: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-surface-container-highest text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                  />
                  <label htmlFor="entity_activo" className="text-sm font-bold text-on-surface cursor-pointer select-none tracking-tight">
                    Elemento Activo
                  </label>
                </div>
              </form>

              <div className="p-8 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-outline-variant/20 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 dark:border-outline-variant/30 text-on-surface-variant font-bold hover:bg-slate-100 dark:hover:bg-surface-container-highest/50 transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-lg shadow-violet-500/20 dark:shadow-violet-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group tracking-tight"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={20} />
                      {isEditing ? "Guardar Cambios" : "Crear Registro"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
