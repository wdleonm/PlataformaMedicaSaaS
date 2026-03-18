"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { 
  User, 
  Building, 
  MapPin, 
  Globe, 
  Instagram, 
  Facebook, 
  Twitter, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Camera,
  Trash2,
  Clock,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfiguracionPerfilPage() {
  const { usuario } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    descripcion_perfil: "",
    clinica_nombre: "",
    clinica_direccion: "",
    redes_sociales: {
      instagram: "",
      facebook: "",
      twitter: "", // o tiktok/linkedin
      whatsapp: ""
    },
    portal_visible: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || "",
        apellido: usuario.apellido || "",
        descripcion_perfil: (usuario as any).descripcion_perfil || "",
        clinica_nombre: (usuario as any).clinica_nombre || "",
        clinica_direccion: (usuario as any).clinica_direccion || "",
        redes_sociales: (usuario as any).redes_sociales || {
          instagram: "",
          facebook: "",
          twitter: "",
          whatsapp: ""
        },
        portal_visible: (usuario as any).portal_visible ?? false
      });
    }
  }, [usuario]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await api.patch("/api/auth/me", formData);
      setMessage({ type: 'success', text: "Perfil actualizado correctamente" });
      // El refresh del contexto de auth se daría al recargar o si implementamos un update local
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || "Error al actualizar el perfil" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/20 rounded-[28px] flex items-center justify-center text-primary shadow-2xl border border-primary/20 backdrop-blur-xl group hover:scale-110 transition-transform duration-500">
            <User size={32} className="group-hover:rotate-6 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1 italic">Mi Perfil Profesional</h1>
            <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] opacity-80 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Identidad Digital y Presencia
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20 group uppercase text-[11px] tracking-widest disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-5 rounded-3xl flex items-center gap-4 border shadow-2xl backdrop-blur-md ${
              message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-200'
            } text-xs font-black`}
          >
            <div className={message.type === 'success' ? 'p-2 bg-emerald-500/20 rounded-xl' : 'p-2 bg-red-500/20 rounded-xl'}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <Trash2 size={20} />}
            </div>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Foto y Bio */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-8 rounded-[40px] border border-white/5 bg-card/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            
            <div className="relative flex flex-col items-center">
              <div className="relative group/avatar cursor-pointer">
                <div className="w-40 h-40 rounded-[48px] bg-gradient-to-br from-primary/30 to-blue-600/30 p-1 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl">
                  <div className="w-full h-full rounded-[44px] bg-secondary/50 flex items-center justify-center text-white/20 group-hover/avatar:scale-105 transition-transform duration-700">
                    <User size={80} />
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/60 rounded-[48px] opacity-0 group-hover/avatar:opacity-100 transition-all flex items-center justify-center flex-col gap-2 backdrop-blur-[2px]">
                   <Camera size={24} className="text-primary" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white">Próximamente</span>
                </div>
              </div>
              
              <div className="mt-8 text-center space-y-2">
                <h3 className="text-xl font-black text-white">{formData.nombre} {formData.apellido}</h3>
                <p className="text-[10px] text-primary uppercase font-black tracking-[0.2em] bg-primary/10 px-4 py-1.5 rounded-full inline-block">
                  Especialista Verificado
                </p>
              </div>

              <div className="w-full mt-10 pt-10 border-t border-white/5 space-y-4">
                 <div className="flex items-center justify-between px-2">
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Portal Público</span>
                   <button 
                     onClick={() => setFormData({...formData, portal_visible: !formData.portal_visible})}
                     className={`w-12 h-6 rounded-full relative transition-all duration-500 ${formData.portal_visible ? 'bg-primary' : 'bg-white/10'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${formData.portal_visible ? 'left-7' : 'left-1'}`} />
                   </button>
                 </div>
                 <p className="text-[9px] text-slate-400 italic px-2 text-center opacity-60">
                    Al activar el portal, pacientes podrán agendar citas online.
                 </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[36px] border border-white/5 bg-secondary/5 backdrop-blur-xl">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-primary/20 rounded-xl text-primary"><Clock size={16} /></div>
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Atención Semanal</h4>
             </div>
             <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
               La configuración del horario de atención estará disponible en la siguiente actualización del sistema (Fase 11.3).
             </p>
          </div>
        </div>

        {/* Columna Derecha: Formularios */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Datos Básicos */}
            <div className="glass-panel p-10 rounded-[48px] border border-white/5 bg-card/30 backdrop-blur-3xl shadow-2xl space-y-8">
              <h3 className="text-lg font-black text-white flex items-center gap-4 italic tracking-tight">
                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                Información Profesional
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 ml-2">Nombre</label>
                  <input 
                    type="text" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4.5 text-white outline-none focus:ring-4 focus:ring-primary/15 transition-all font-bold placeholder:text-white/10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 ml-2">Apellido</label>
                  <input 
                    type="text" 
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4.5 text-white outline-none focus:ring-4 focus:ring-primary/15 transition-all font-bold placeholder:text-white/10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 ml-2">Biografía o Resumen Profesional</label>
                <textarea 
                  rows={4}
                  value={formData.descripcion_perfil}
                  onChange={(e) => setFormData({...formData, descripcion_perfil: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-white outline-none focus:ring-4 focus:ring-primary/15 transition-all font-medium placeholder:text-white/10 text-sm resize-none scrollbar-hide"
                  placeholder="Ej: Odontólogo con 15 años de experiencia especializado en implantología dental y estética..."
                />
              </div>
            </div>

            {/* Datos de la Clínica */}
            <div className="glass-panel p-10 rounded-[48px] border border-white/5 bg-card/30 backdrop-blur-3xl shadow-2xl space-y-8">
              <h3 className="text-lg font-black text-white flex items-center gap-4 italic tracking-tight">
                 <div className="w-1.5 h-6 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                 Datos de la Clínica / Consultorio
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 ml-2 flex items-center gap-2">
                    <Building size={12} className="text-violet-400" /> Nombre Comercial
                  </label>
                  <input 
                    type="text" 
                    value={formData.clinica_nombre}
                    onChange={(e) => setFormData({...formData, clinica_nombre: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4.5 text-white outline-none focus:ring-4 focus:ring-violet-500/15 transition-all font-bold text-sm"
                    placeholder="Ej: Clínica Dental 'San Jose'"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-500 ml-2 flex items-center gap-2">
                    <MapPin size={12} className="text-violet-400" /> Dirección Física (Recibos)
                  </label>
                  <input 
                    type="text" 
                    value={formData.clinica_direccion}
                    onChange={(e) => setFormData({...formData, clinica_direccion: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4.5 text-white outline-none focus:ring-4 focus:ring-violet-500/15 transition-all font-bold text-sm"
                    placeholder="Calle, Edificio, Consultorio..."
                  />
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="glass-panel p-10 rounded-[48px] border border-white/5 bg-card/30 backdrop-blur-3xl shadow-2xl space-y-8">
              <h3 className="text-lg font-black text-white flex items-center gap-4 italic tracking-tight">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                Presencia Digital y Social
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <div className="flex items-center gap-3 ml-2 mb-1">
                    <div className="p-1.5 bg-pink-500/20 rounded-lg text-pink-400"><Instagram size={14} /></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-pink-400 transition-colors">Instagram</label>
                  </div>
                  <input 
                    type="text" 
                    value={formData.redes_sociales.instagram}
                    onChange={(e) => setFormData({
                      ...formData, 
                      redes_sociales: {...formData.redes_sociales, instagram: e.target.value}
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-pink-500/30 transition-all font-medium text-sm"
                    placeholder="@doctor_ejemplo"
                  />
                </div>

                <div className="space-y-2 group">
                  <div className="flex items-center gap-3 ml-2 mb-1">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400"><Facebook size={14} /></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-blue-400 transition-colors">Facebook</label>
                  </div>
                  <input 
                    type="text" 
                    value={formData.redes_sociales.facebook}
                    onChange={(e) => setFormData({
                      ...formData, 
                      redes_sociales: {...formData.redes_sociales, facebook: e.target.value}
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium text-sm"
                    placeholder="facebook.com/doctor"
                  />
                </div>

                <div className="space-y-2 group">
                  <div className="flex items-center gap-3 ml-2 mb-1">
                    <div className="p-1.5 bg-green-500/20 rounded-lg text-green-400"><Globe size={14} /></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-green-400 transition-colors">WhatsApp Link</label>
                  </div>
                  <input 
                    type="text" 
                    value={formData.redes_sociales.whatsapp}
                    onChange={(e) => setFormData({
                      ...formData, 
                      redes_sociales: {...formData.redes_sociales, whatsapp: e.target.value}
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-green-500/30 transition-all font-medium text-sm"
                    placeholder="wa.me/numerodecelular"
                  />
                </div>

                <div className="space-y-2 group">
                  <div className="flex items-center gap-3 ml-2 mb-1">
                    <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400"><Twitter size={14} /></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-focus-within:text-cyan-400 transition-colors">Twitter / X</label>
                  </div>
                  <input 
                    type="text" 
                    value={formData.redes_sociales.twitter}
                    onChange={(e) => setFormData({
                      ...formData, 
                      redes_sociales: {...formData.redes_sociales, twitter: e.target.value}
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-medium text-sm"
                    placeholder="@doctorx"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
