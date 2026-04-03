"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { 
  User, 
  Building2, 
  Share2, 
  ExternalLink, 
  Save, 
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Phone,
  TextIcon,
  MapPin,
  CheckCircle2,
  BadgeDollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoUpload } from "@/components/LogoUpload";

const BCVHistorialTab = () => {
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dashboard/bcv-historial").then(res => {
      setHistorial(res.data);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card/50 backdrop-blur-xl border border-border/10 rounded-[32px] p-8 space-y-6 shadow-2xl">
      <div>
         <h2 className="text-xl font-black">Historial de Tasas BCV</h2>
         <p className="text-sm text-muted-foreground mt-1">Registro de los últimos 60 días de las tasas de cambio de referencia del Banco Central de Venezuela.</p>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse text-sm font-bold">Cargando historial...</div>
      ) : (
        <div className="border border-border/10 rounded-2xl overflow-hidden bg-secondary/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/40 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              <tr>
                <th className="p-4">Fecha (UTC)</th>
                <th className="p-4">Tasa USD</th>
                <th className="p-4">Tasa EUR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {historial.map(row => (
                <tr key={row.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-medium">{new Date(row.fecha).toLocaleDateString()}</td>
                  <td className="p-4 text-emerald-500 font-bold">Bs. {row.tasa_usd.toFixed(2)}</td>
                  <td className="p-4 text-blue-500 font-bold">Bs. {row.tasa_eur.toFixed(2)}</td>
                </tr>
              ))}
              {historial.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground italic">No hay historial registrado aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default function ConfiguracionPage() {
  const { usuario, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'clinica' | 'redes' | 'portal' | 'finanzas'>('perfil');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || "",
    apellido: usuario?.apellido || "",
    descripcion_perfil: usuario?.descripcion_perfil || "",
    clinica_nombre: usuario?.clinica_nombre || "",
    clinica_direccion: usuario?.clinica_direccion || "",
    portal_visible: usuario?.portal_visible || false,
    mostrar_precios_portal: usuario?.mostrar_precios_portal || false,
    slug_url: usuario?.slug_url || "",
    redes_sociales: usuario?.redes_sociales || {
      instagram: "",
      facebook: "",
      whatsapp: "",
      tiktok: ""
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch("/api/auth/me", formData);
      await refreshUser();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving config:", error);
      alert("No se pudo guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Mi Perfil', icon: User },
    { id: 'clinica', label: 'Identidad Clínica', icon: Building2 },
    { id: 'redes', label: 'Redes Sociales', icon: Share2 },
    { id: 'portal', label: 'Portal Público', icon: Globe },
    { id: 'finanzas', label: 'Tasas BCV', icon: BadgeDollarSign },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Configuración Profesional
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Gestiona tu identidad digital y presencia de marca.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500"
          >
            <CheckCircle2 size={20} />
            <span className="font-bold text-sm">Configuración actualizada exitosamente</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2 p-1 bg-secondary/30 rounded-2xl border border-border/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === tab.id 
                ? "text-primary-foreground" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabConfig"
                className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon size={14} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'perfil' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card/50 backdrop-blur-xl border border-border/10 rounded-[32px] p-8 space-y-6 shadow-2xl"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</label>
                  <input 
                    type="text" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellido</label>
                  <input 
                    type="text" 
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <TextIcon size={12} /> Biografía Profesional
                </label>
                <textarea 
                  rows={6}
                  value={formData.descripcion_perfil}
                  onChange={(e) => setFormData({...formData, descripcion_perfil: e.target.value})}
                  placeholder="Describe tu trayectoria, especialidades y enfoque clínico..."
                  className="w-full bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 transition-all outline-none resize-none"
                />
                <p className="text-[10px] text-muted-foreground italic px-1">Este texto aparecerá en tu perfil público para que los pacientes te conozcan.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'clinica' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card/50 backdrop-blur-xl border border-border/10 rounded-[32px] p-8 space-y-8 shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Comercial de la Clínica</label>
                    <input 
                      type="text" 
                      value={formData.clinica_nombre}
                      onChange={(e) => setFormData({...formData, clinica_nombre: e.target.value})}
                      placeholder="Ej: Clínica Dental Smile"
                      className="w-full bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                      <MapPin size={12} /> Dirección Física
                    </label>
                    <textarea 
                      rows={3}
                      value={formData.clinica_direccion}
                      onChange={(e) => setFormData({...formData, clinica_direccion: e.target.value})}
                      placeholder="Calle, Edificio, Consultorio..."
                      className="w-full bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 transition-all outline-none resize-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Logo de la Clínica</label>
                  <LogoUpload 
                    currentLogo={usuario?.clinica_logo_url} 
                    onUploadSuccess={(url) => refreshUser()} 
                  />
                  <p className="text-[10px] text-center text-muted-foreground mt-2">El logo se usará en presupuestos y recibos digitales.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'redes' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card/50 backdrop-blur-xl border border-border/10 rounded-[32px] p-8 space-y-6 shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Instagram size={14} className="text-pink-500" /> Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <input 
                      type="text" 
                      value={formData.redes_sociales.instagram}
                      onChange={(e) => setFormData({
                        ...formData, 
                        redes_sociales: {...formData.redes_sociales, instagram: e.target.value}
                      })}
                      placeholder="usuario"
                      className="w-full bg-secondary/50 border border-border/10 rounded-2xl pl-8 pr-4 py-3 text-sm focus:ring-2 ring-pink-500/20 transition-all outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Phone size={14} className="text-emerald-500" /> WhatsApp Business
                  </label>
                  <input 
                    type="text" 
                    value={formData.redes_sociales.whatsapp}
                    onChange={(e) => setFormData({
                      ...formData, 
                      redes_sociales: {...formData.redes_sociales, whatsapp: e.target.value}
                    })}
                    placeholder="+584120000000"
                    className="w-full bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-emerald-500/20 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <Facebook size={14} className="text-blue-600" /> Facebook
                  </label>
                  <input 
                    type="text" 
                    value={formData.redes_sociales.facebook}
                    onChange={(e) => setFormData({
                      ...formData, 
                      redes_sociales: {...formData.redes_sociales, facebook: e.target.value}
                    })}
                    placeholder="Enlace a tu página o perfil"
                    className="w-full bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-blue-600/20 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <TextIcon size={14} className="text-black dark:text-white" /> TikTok
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <input 
                      type="text" 
                      value={formData.redes_sociales.tiktok}
                      onChange={(e) => setFormData({
                        ...formData, 
                        redes_sociales: {...formData.redes_sociales, tiktok: e.target.value}
                      })}
                      placeholder="usuario"
                      className="w-full bg-secondary/50 border border-border/10 rounded-2xl pl-8 pr-4 py-3 text-sm focus:ring-2 ring-foreground/20 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'portal' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card/50 backdrop-blur-xl border border-border/10 rounded-[32px] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/10 group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formData.portal_visible ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Visibilidad en el Portal Público</h3>
                    <p className="text-[10px] text-muted-foreground">Permitir que pacientes te encuentren y agenden online.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFormData({...formData, portal_visible: !formData.portal_visible})}
                  className={`w-14 h-7 rounded-full transition-all relative ${formData.portal_visible ? "bg-emerald-500" : "bg-muted"}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.portal_visible ? "right-1" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL de tu Perfil Público</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-secondary/50 border border-border/10 rounded-2xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-1 font-mono">
                    vitalnexus.com/p/
                    <input 
                      type="text" 
                      value={formData.slug_url}
                      onChange={(e) => setFormData({...formData, slug_url: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      placeholder="tu-nombre"
                      className="bg-transparent border-none outline-none text-foreground font-bold w-full"
                    />
                  </div>
                  {formData.slug_url && (
                    <a 
                      href={`/p/${formData.slug_url}`} 
                      target="_blank"
                      className="p-3 bg-secondary hover:bg-primary hover:text-white rounded-2xl transition-all"
                      title="Ver portal"
                    >
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground px-1">Usa un nombre corto y fácil de recordar.</p>
              </div>

              {/* Fase 9.2: Toggle visibilidad de precios */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/10 group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formData.mostrar_precios_portal ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    <BadgeDollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Mostrar Precios en el Portal</h3>
                    <p className="text-[10px] text-muted-foreground">Los pacientes verán el precio de cada servicio al agendar.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFormData({...formData, mostrar_precios_portal: !formData.mostrar_precios_portal})}
                  className={`w-14 h-7 rounded-full transition-all relative ${formData.mostrar_precios_portal ? "bg-amber-500" : "bg-muted"}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.mostrar_precios_portal ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'finanzas' && <BCVHistorialTab />}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-primary/20 to-blue-600/10 border border-primary/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
            
            <h3 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-primary" /> Consejos Pro
            </h3>
            
            <ul className="space-y-4 relative z-10">
              <li className="flex gap-3 text-xs leading-relaxed">
                <div className="shrink-0 w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-bold text-[10px]">1</div>
                <p>Sube un logo con fondo transparente (PNG) para que se vea premium en tus recibos.</p>
              </li>
              <li className="flex gap-3 text-xs leading-relaxed">
                <div className="shrink-0 w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-bold text-[10px]">2</div>
                <p>Tu biografía profesional ayuda a generar confianza antes de la cita inicial.</p>
              </li>
              <li className="flex gap-3 text-xs leading-relaxed">
                <div className="shrink-0 w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-bold text-[10px]">3</div>
                <p>Asegúrate de que tu link de WhatsApp tenga el formato internacional (ej: +58...).</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
