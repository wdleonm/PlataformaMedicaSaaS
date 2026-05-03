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
  UserPlus,
  Plus,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Stethoscope
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
  exigir_cambio_password: boolean;
  intervalo_cambio_password: number | null;
  forzar_cambio_password_proximo_acceso: boolean;
  created_at: string;
  plan?: Plan;
  especialidad_principal_id?: string | null;
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
  
  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dependencyCheck, setDependencyCheck] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<Especialista | null>(null);
  const [adminPin, setAdminPin] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState("");

  // Quick Add Specialty state
  const [isQuickSpecModalOpen, setIsQuickSpecModalOpen] = useState(false);
  const [newSpec, setNewSpec] = useState({ nombre: "", codigo: "" });
  const [isSavingSpec, setIsSavingSpec] = useState(false);
  const [isQuickCodeManuallyEdited, setIsQuickCodeManuallyEdited] = useState(false);

  // Sugerencia automática de código en Quick Add
  useEffect(() => {
    if (isQuickSpecModalOpen && newSpec.nombre && !isQuickCodeManuallyEdited) {
      const name = newSpec.nombre.trim().toUpperCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      let suggestedCode = "";
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
        suggestedCode = `${name.substring(0, 3)}_${name.length > 3 ? "GEN" : "001"}`;
      }
      
      setNewSpec(prev => ({ ...prev, codigo: suggestedCode }));
    }
  }, [newSpec.nombre, isQuickSpecModalOpen, isQuickCodeManuallyEdited]);

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

  const fetchSpecialties = async () => {
    try {
      const { data } = await api.get("/api/admin/config/especialidades");
      setEspecialidades(data);
    } catch (err) {
      console.error("Error loading specialties:", err);
    }
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
      suscripcion_activa: true,
      exigir_cambio_password: false,
      intervalo_cambio_password: null,
      forzar_cambio_password_proximo_acceso: true
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
    
    // Si no se exige cambio, el intervalo debe ser null para limpieza de BD
    const payload = { 
      ...currentEsp, 
      intervalo_cambio_password: currentEsp.exigir_cambio_password ? currentEsp.intervalo_cambio_password : null 
    };

    try {
      if (isEditing) {
        await api.patch(`/api/admin/especialistas/${currentEsp.id}`, payload);
      } else {
        await api.post("/api/admin/especialistas/", payload);
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

  const handleOpenDelete = async (esp: Especialista) => {
    setDeleteTarget(esp);
    try {
      setIsLoading(true);
      const { data } = await api.get(`/api/admin/especialistas/${esp.id}/check-dependencies`);
      setDependencyCheck(data);
      setIsDeleteModalOpen(true);
    } catch (err) {
      alert("Error al verificar dependencias del especialista");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async (cascade: boolean = false) => {
    if (!deleteTarget) return;
    if (cascade && !adminPin) {
      alert("Debes ingresar el PIN de seguridad para eliminaciones en cascada");
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/especialistas/${deleteTarget.id}?cascade=${cascade}&admin_pin=${adminPin}`);
      setIsDeleteModalOpen(false);
      setAdminPin("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al eliminar especialista");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetPin = async () => {
    if (!newPin || newPin.length < 4) {
       alert("El PIN debe tener al menos 4 caracteres");
       return;
    }
    try {
      await api.post(`/api/admin/especialistas/config/set-pin?pin=${newPin}`);
      alert("PIN de seguridad configurado exitosamente");
      setShowPinSetup(false);
      setNewPin("");
    } catch (err) {
      alert("Error al configurar el PIN");
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

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-violet-500/5 border border-violet-500/10 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Seguridad Master</p>
            <p className="text-[10px] text-slate-500 font-medium">El PIN de seguridad protege eliminaciones irreversibles.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowPinSetup(true)}
          className="text-[10px] font-black uppercase tracking-widest bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 px-4 py-2 rounded-xl transition-all border border-violet-500/20"
        >
          {dependencyCheck?.pin_configurado ? "Cambiar PIN de Seguridad" : "Configurar PIN de Seguridad"}
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
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Especialidad</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Plan / Estado</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Vencimiento</th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-violet-400/80">Registro</th>
                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-violet-400/80">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin text-violet-500 mx-auto" size={40} />
                    <p className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-xs">Obteniendo registros...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
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
                      {(() => {
                        const espSpec = especialidades.find(e => e.id === esp.especialidad_principal_id);
                        return espSpec ? (
                          <div className="flex items-center gap-2">
                            <Stethoscope size={14} className="text-violet-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-300 tracking-tight">{espSpec.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Sin asignar</span>
                        );
                      })()}
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
                          title="Editar Especialista"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(esp)}
                          className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-400 hover:text-white hover:bg-red-600 transition-all"
                          title="Eliminar Especialista"
                        >
                          <Trash2 size={18} />
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre <span className="text-violet-400">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={currentEsp.nombre || ""}
                      onChange={(e) => setCurrentEsp({...currentEsp, nombre: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-violet-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Apellido <span className="text-violet-400">*</span></label>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Correo Electrónico <span className="text-violet-400">*</span></label>
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

                <div className="space-y-4 p-6 bg-slate-900/40 rounded-[32px] border border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/80 ml-1">Seguridad de Acceso</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      {isEditing ? "Resetear Contraseña (opcional)" : "Contraseña Inicial"} <span className="text-violet-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        type="password" 
                        required={!isEditing}
                        placeholder={isEditing ? "Ingresa nueva clave para resetear..." : "••••••••"}
                        value={currentEsp.password || ""}
                        onChange={(e) => setCurrentEsp({...currentEsp, password: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:ring-2 focus:ring-violet-500/50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-violet-500/5 rounded-2xl border border-violet-500/10 hover:bg-violet-500/10 transition-colors cursor-pointer" onClick={() => setCurrentEsp({...currentEsp, forzar_cambio_password_proximo_acceso: !currentEsp.forzar_cambio_password_proximo_acceso})}>
                    <input 
                      type="checkbox" 
                      id="forzar_pw_next"
                      checked={currentEsp.forzar_cambio_password_proximo_acceso || false}
                      onChange={(e) => setCurrentEsp({...currentEsp, forzar_cambio_password_proximo_acceso: e.target.checked})}
                      className="w-5 h-5 rounded border-violet-500/20 bg-violet-500/10 text-violet-500 focus:ring-violet-500"
                    />
                    <label htmlFor="forzar_pw_next" className="text-sm font-bold text-violet-200 cursor-pointer select-none tracking-tight">
                      Forzar cambio de clave en el próximo inicio de sesión
                    </label>
                  </div>
                </div>

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
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Especialidad Principal</label>
                      <button 
                        type="button"
                        onClick={() => setIsQuickSpecModalOpen(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                      >
                        <Plus size={10} /> Nueva
                      </button>
                    </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col gap-3 p-5 bg-white/5 rounded-[24px] border border-white/10">
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        id="exigir_pw"
                        checked={currentEsp.exigir_cambio_password || false}
                        onChange={(e) => setCurrentEsp({...currentEsp, exigir_cambio_password: e.target.checked})}
                        className="w-5 h-5 rounded border-violet-500/20 bg-violet-500/10 text-violet-500 focus:ring-violet-500"
                      />
                      <label htmlFor="exigir_pw" className="text-sm font-black text-slate-300 cursor-pointer select-none tracking-tight">
                        Rotación periódica de clave
                      </label>
                    </div>
                    {currentEsp.exigir_cambio_password && (
                      <div className="mt-2 space-y-2 animate-fade-in">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Frecuencia sugerida (días)</label>
                        <select 
                          value={currentEsp.intervalo_cambio_password || 90}
                          onChange={(e) => setCurrentEsp({...currentEsp, intervalo_cambio_password: parseInt(e.target.value)})}
                          className="w-full bg-[#0a0514]/40 border border-white/20 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-violet-500/40 outline-none"
                        >
                          <option value={60} className="bg-[#130b22]">60 Días (Cada 2 meses)</option>
                          <option value={90} className="bg-[#130b22]">90 Días (Cada 3 meses)</option>
                          <option value={120} className="bg-[#130b22]">120 Días (Cada 4 meses)</option>
                          <option value={180} className="bg-[#130b22]">180 Días (Semestral)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </form>

              {/* Footer Modal */}
              <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between gap-4">
                <p className="text-[10px] text-slate-500 italic font-medium">
                  <span className="text-violet-400 font-black not-italic">*</span> Campos obligatorios
                </p>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-4 px-8 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all outline-none uppercase tracking-widest text-[10px]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="py-4 px-8 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black shadow-lg shadow-violet-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group tracking-tight text-sm min-w-[160px]"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {isEditing ? "Guardar Cambios" : "Completar Registro"}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Eliminación */}
      <AnimatePresence>
        {isDeleteModalOpen && deleteTarget && dependencyCheck && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0a0514] border border-red-500/20 rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
                  <Trash2 size={40} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white italic tracking-tight">¿Eliminar Especialista?</h3>
                  <p className="text-slate-400 text-sm font-medium">Estás a punto de eliminar a <span className="text-white font-bold">{deleteTarget.nombre} {deleteTarget.apellido}</span></p>
                </div>

                {/* Resumen de Dependencias */}
                <div className="w-full bg-red-500/5 border border-red-500/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3 text-red-400 mb-2">
                    <ShieldAlert size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Registros Vinculados Encontrados</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Pacientes", val: dependencyCheck.pacientes },
                      { label: "Citas", val: dependencyCheck.citas },
                      { label: "Servicios", val: dependencyCheck.servicios },
                      { label: "Insumos", val: dependencyCheck.insumos },
                    ].map(d => (
                      <div key={d.label} className="bg-black/40 border border-white/5 p-3 rounded-2xl flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{d.label}</span>
                        <span className={`text-sm font-black ${d.val > 0 ? 'text-red-400' : 'text-slate-600'}`}>{d.val}</span>
                      </div>
                    ))}
                  </div>

                  {dependencyCheck.es_borrable_directo ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                      <CheckCircle2 size={16} />
                      <p className="text-[10px] font-black uppercase tracking-tight">Solo posee datos de prueba. Seguro para eliminar.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400 text-left">
                      <AlertTriangle size={20} className="shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight mb-1">Protección de Datos</p>
                        <p className="text-[11px] leading-relaxed font-medium">Este especialista tiene datos reales. Si continúas, se borrarán permanentemente pacientes, historias y finanzas relacionadas.</p>
                      </div>
                    </div>
                  )}
                </div>

                {!dependencyCheck.es_borrable_directo && (
                  <div className="w-full space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-red-400/80 ml-1">Ingresa PIN de Seguridad Master</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400/50" size={18} />
                      <input 
                        type="password"
                        placeholder="••••"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-4 pl-12 text-white text-center text-xl tracking-[0.5em] focus:ring-2 focus:ring-red-500/50 outline-none font-black"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col w-full gap-3 pt-4">
                   <button 
                    onClick={() => handleConfirmDelete(!dependencyCheck.es_borrable_directo)}
                    disabled={isDeleting}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 group uppercase tracking-widest text-xs"
                  >
                    {isDeleting ? <Loader2 className="animate-spin" size={18} /> : (
                      dependencyCheck.es_borrable_directo ? "Confirmar Eliminación" : "Eliminar todo en Cascada"
                    )}
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Cancelar y Volver
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Configurar PIN */}
      <AnimatePresence>
        {showPinSetup && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPinSetup(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#130b22] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex flex-col items-center text-center gap-6">
                 <div className="w-20 h-20 rounded-3xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <ShieldCheck size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white italic tracking-tight">PIN de Seguridad</h3>
                    <p className="text-slate-400 text-xs font-medium">Este PIN será necesario para autorizar eliminaciones masivas o de datos reales.</p>
                  </div>
                  <input 
                    type="password"
                    placeholder="Nuevo PIN (min. 4 carac.)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center text-lg tracking-[0.5em] focus:ring-2 focus:ring-violet-500/50 outline-none"
                  />
                  <div className="grid grid-cols-2 w-full gap-3">
                    <button 
                      onClick={() => setShowPinSetup(false)}
                      className="py-3 bg-white/5 text-slate-400 font-bold rounded-xl text-xs uppercase tracking-widest"
                    >
                      Cerrar
                    </button>
                    <button 
                      onClick={handleSetPin}
                      className="py-3 bg-violet-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-violet-900/20"
                    >
                      Guardar
                    </button>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Quick Add Specialty */}
      <AnimatePresence>
        {isQuickSpecModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickSpecModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#1a0f2e] border border-violet-500/30 rounded-[32px] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-white italic tracking-tight">Agregar Especialidad</h4>
                  <p className="text-violet-400/60 text-[10px] font-black uppercase tracking-widest mt-1">Acceso Rápido</p>
                </div>
                <button onClick={() => setIsQuickSpecModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Endodoncia"
                    value={newSpec.nombre}
                    onChange={(e) => setNewSpec({...newSpec, nombre: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-violet-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código</label>
                  <input 
                    type="text" 
                    placeholder="Ej. ODO_END"
                    value={newSpec.codigo}
                    onChange={(e) => {
                      setIsQuickCodeManuallyEdited(true);
                      setNewSpec({...newSpec, codigo: e.target.value.toUpperCase()});
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono focus:ring-2 focus:ring-violet-500/50 outline-none"
                  />
                </div>

                <button 
                  onClick={async () => {
                    if(!newSpec.nombre || !newSpec.codigo) return alert("Completa todos los campos");
                    setIsSavingSpec(true);
                    try {
                      const { data } = await api.post("/api/admin/config/especialidades", { ...newSpec, activo: true });
                      await fetchSpecialties(); // Refrescar lista de especialidades
                      setCurrentEsp({ ...currentEsp, especialidad_principal_id: data.id }); // Seleccionarla automáticamente
                      setIsQuickSpecModalOpen(false);
                      setNewSpec({ nombre: "", codigo: "" });
                      setIsQuickCodeManuallyEdited(false);
                    } catch (err: any) {
                      alert(err.response?.data?.detail || "Error al crear especialidad");
                    } finally {
                      setIsSavingSpec(false);
                    }
                  }}
                  disabled={isSavingSpec}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingSpec ? <Loader2 className="animate-spin" size={18} /> : "Crear Especialidad"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
