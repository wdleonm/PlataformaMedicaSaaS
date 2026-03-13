"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CreditCard, 
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
  ShieldAlert,
  X,
  Save,
  Mail,
  Lock,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Plan {
  id: string;
  nombre: string;
  codigo: string;
}

interface Especialidad {
  id: string;
  nombre: string;
}

interface Especialista {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  suscripcion_activa: boolean;
  fecha_vencimiento_suscripcion: string | null;
  plan_suscripcion_id: string | null;
  created_at: string;
  plan?: Plan;
}

export default function AdminEspecialistasPage() {
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEsp, setCurrentEsp] = useState<Partial<Especialista & { password?: string, especialidad_principal_id?: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/api/admin/especialistas/");
      setEspecialistas(data);
    } catch (err) {
      console.error("Error loading specialists:", err);
    }

    try {
      const { data } = await api.get("/api/admin/planes/");
      setPlanes(data);
    } catch (err) {
      console.error("Error loading plans:", err);
    }

    try {
      const { data } = await api.get("/api/admin/config/especialidades");
      setEspecialidades(data);
    } catch (err) {
      console.error("Error loading specialties:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentEsp({
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      plan_suscripcion_id: planes[0]?.id || "",
      activo: true,
      suscripcion_activa: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (esp: Especialista) => {
    setIsEditing(true);
    setCurrentEsp(esp);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.patch(`/api/admin/especialistas/${currentEsp.id}`, currentEsp);
      } else {
        await api.post("/api/admin/especialistas/", currentEsp);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al guardar especialista");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActivo = async (esp: Especialista) => {
    try {
      await api.patch(`/api/admin/especialistas/${esp.id}`, { activo: !esp.activo });
      fetchData();
    } catch (err) {
      alert("Error al actualizar estado");
    }
  };

  const filtered = especialistas.filter(e => 
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Especialistas</h1>
          <p className="text-slate-400 mt-1 font-medium italic underline decoration-violet-500/30">Control de acceso y suscripciones Master.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-violet-900/20 active:scale-95 transition-all text-sm"
        >
          <UserPlus size={18} /> Registrar Nuevo Médico
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo electrónico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-violet-500/40 outline-none transition-all placeholder:text-slate-600 font-medium"
          />
        </div>
        <button className="bg-white/5 border border-white/10 p-4 rounded-2xl text-slate-400 hover:text-white transition-colors">
          <Filter size={20} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Especialista</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Plan / Estado</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Vencimiento</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Registro</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-violet-400/80">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-violet-500 mx-auto" size={40} />
                    <p className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-xs">Obteniendo registros...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontraron especialistas</p>
                  </td>
                </tr>
              ) : (
                filtered.map((esp, idx) => (
                  <motion.tr 
                    key={esp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center font-black text-violet-400">
                          {esp.nombre[0]}{esp.apellido[0]}
                        </div>
                        <div>
                          <p className="font-black text-white text-sm group-hover:text-violet-400 transition-colors uppercase tracking-tight">{esp.nombre} {esp.apellido}</p>
                          <p className="text-xs text-slate-500 font-medium lowercase tracking-tight">{esp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-slate-500" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">
                            {esp.plan?.nombre || "Sin Plan"}
                          </span>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          esp.suscripcion_activa ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {esp.suscripcion_activa ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {esp.suscripcion_activa ? "Suscrip. Activa" : "Suscrip. Inactiva"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {esp.fecha_vencimiento_suscripcion 
                            ? format(new Date(esp.fecha_vencimiento_suscripcion), "dd MMM, yyyy", { locale: es })
                            : "Ilimitado"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-xs font-mono font-bold uppercase tracking-widest">
                      {format(new Date(esp.created_at), "dd/MM/yy")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleActivo(esp)}
                          className={`p-2.5 rounded-xl transition-all border ${
                            esp.activo 
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" 
                              : "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/20"
                          }`}
                          title={esp.activo ? "Desactivar Acceso General" : "Activar Acceso General"}
                        >
                          {esp.activo ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(esp)}
                          className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Edit size={18} />
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
              className="relative w-full max-w-2xl bg-[#130b22] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
            >
              {/* Header Modal */}
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight">
                    {isEditing ? `Editar: ${currentEsp.nombre}` : "Registrar Nuevo Especialista"}
                  </h3>
                  <p className="text-violet-400/60 text-[10px] font-black uppercase tracking-widest mt-1">Configuración Master de Acceso</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre</label>
                    <input 
                      type="text" 
                      required
                      value={currentEsp.nombre || ""}
                      onChange={(e) => setCurrentEsp({...currentEsp, nombre: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Apellido</label>
                    <input 
                      type="text" 
                      required
                      value={currentEsp.apellido || ""}
                      onChange={(e) => setCurrentEsp({...currentEsp, apellido: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="email" 
                      required
                      disabled={isEditing}
                      value={currentEsp.email || ""}
                      onChange={(e) => setCurrentEsp({...currentEsp, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:ring-2 focus:ring-violet-500/50 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contraseña Inicial</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        type="password" 
                        required
                        value={currentEsp.password || ""}
                        onChange={(e) => setCurrentEsp({...currentEsp, password: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:ring-2 focus:ring-violet-500/50 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Plan de Suscripción</label>
                    <select 
                      value={currentEsp.plan_suscripcion_id || ""}
                      onChange={(e) => setCurrentEsp({...currentEsp, plan_suscripcion_id: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none appearance-none"
                    >
                      {planes.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#130b22] text-white">{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Especialidad Principal</label>
                    <select 
                      value={currentEsp.especialidad_principal_id || ""}
                      onChange={(e) => setCurrentEsp({...currentEsp, especialidad_principal_id: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none appearance-none disabled:opacity-50"
                    >
                      <option value="" className="bg-[#130b22]">Seleccionar Especialidad...</option>
                      {especialidades.map(e => (
                        <option key={e.id} value={e.id} className="bg-[#130b22] text-white">{e.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                   <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <input 
                      type="checkbox" 
                      id="suscrip_activa"
                      checked={currentEsp.suscripcion_activa}
                      onChange={(e) => setCurrentEsp({...currentEsp, suscripcion_activa: e.target.checked})}
                      className="w-5 h-5 rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="suscrip_activa" className="text-sm font-bold text-white cursor-pointer select-none tracking-tight">
                      Suscripción Activa
                    </label>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <input 
                      type="checkbox" 
                      id="acc_activo"
                      checked={currentEsp.activo}
                      onChange={(e) => setCurrentEsp({...currentEsp, activo: e.target.checked})}
                      className="w-5 h-5 rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="acc_activo" className="text-sm font-bold text-white cursor-pointer select-none tracking-tight">
                      Acceso a Plataforma
                    </label>
                  </div>
                </div>
              </form>

              {/* Footer Modal */}
              <div className="p-8 bg-black/20 border-t border-white/5 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 px-6 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all outline-none uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-lg shadow-violet-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group tracking-tight"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={20} />
                      {isEditing ? "Guardar Cambios" : "Completar Registro"}
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
