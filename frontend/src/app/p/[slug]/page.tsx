"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  IdCard,
  ChevronLeft,
  Loader2,
  Info,
  MapPin,
  Instagram,
  Facebook,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PublicService {
  id: string;
  nombre: string;
  precio: number;
  duracion_estimada_min: number;
}

interface PublicSpecialist {
  id: string;
  nombre: string;
  apellido: string;
  descripcion_perfil: string | null;
  horario_atencion: any;
  especialidades: string[];
  servicios: PublicService[];
  clinica_nombre: string | null;
  clinica_logo_url: string | null;
  clinica_direccion: string | null;
  redes_sociales: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
  } | null;
}

// TikTok icon (not in lucide)
const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.76a8.28 8.28 0 0 0 3.76.92V6.24a4.85 4.85 0 0 1-0 .45z"/>
  </svg>
);

export default function PublicBookingPortal() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [specialist, setSpecialist] = useState<PublicSpecialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [step, setStep] = useState(1); // 1: Service, 2: Info, 3: Success
  
  // Selection state
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    email: "",
    telefono: "",
    fecha: "",
    hora: "",
    notas: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPortal() {
      try {
        const { data } = await api.get(`/api/public/p/${slug}`);
        setSpecialist(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPortal();
  }, [slug]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const dniRegex = /^[VEP]-\d+$/;
    if (!dniRegex.test(formData.documento)) {
      alert("El documento debe tener el formato V-12345678, E-12345678 o P-12345678 (Letra en mayúscula y con guion).");
      setSubmitting(false);
      return;
    }

    if (!formData.email && !formData.telefono) {
      alert("Debes proporcionar al menos un medio de contacto (Correo o Teléfono).");
      setSubmitting(false);
      return;
    }

    try {
      await api.post(`/api/public/p/${slug}/reserva`, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        documento: formData.documento,
        email: formData.email,
        telefono: formData.telefono,
        servicio_id: selectedService?.id,
        fecha_hora: `${formData.fecha}T${formData.hora}:00`,
        notas: formData.notas
      });
      setStep(3);
    } catch {
      alert("Error al agendar la cita. Por favor verifique los datos o intente más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: build social links
  const socialLinks = specialist?.redes_sociales ? [
    specialist.redes_sociales.instagram && { 
      icon: <Instagram size={18} />, 
      href: specialist.redes_sociales.instagram.startsWith('http') ? specialist.redes_sociales.instagram : `https://instagram.com/${specialist.redes_sociales.instagram.replace('@', '')}`,
      label: "Instagram"
    },
    specialist.redes_sociales.facebook && {
      icon: <Facebook size={18} />,
      href: specialist.redes_sociales.facebook.startsWith('http') ? specialist.redes_sociales.facebook : `https://facebook.com/${specialist.redes_sociales.facebook}`,
      label: "Facebook"
    },
    specialist.redes_sociales.tiktok && {
      icon: <TikTokIcon size={18} />,
      href: specialist.redes_sociales.tiktok.startsWith('http') ? specialist.redes_sociales.tiktok : `https://tiktok.com/@${specialist.redes_sociales.tiktok.replace('@', '')}`,
      label: "TikTok"
    },
    specialist.redes_sociales.whatsapp && {
      icon: <MessageCircle size={18} />,
      href: `https://wa.me/${specialist.redes_sociales.whatsapp.replace(/\D/g, '')}`,
      label: "WhatsApp"
    }
  ].filter(Boolean) as { icon: React.ReactNode; href: string; label: string }[] : [];

  if (loading) return (
    <div className="min-h-screen bg-[#0a0514] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-violet-400 font-medium animate-pulse tracking-widest uppercase text-xs">Cargando Portal...</p>
    </div>
  );

  if (error || !specialist) return (
    <div className="min-h-screen bg-[#0a0514] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
        <Info className="text-red-400" size={40} />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Portal no disponible</h1>
      <p className="text-slate-400 max-w-sm mb-8">El enlace que has seguido no es válido o el doctor ha desactivado su portal de reservas.</p>
      <button onClick={() => window.history.back()} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-bold">Volver atrás</button>
    </div>
  );

  const hasLogo = specialist.clinica_logo_url && specialist.clinica_logo_url.length > 5;

  return (
    <div className="min-h-screen bg-[#0a0514] text-slate-200 font-sans selection:bg-violet-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header Perfil */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Logo o Iniciales */}
          {hasLogo ? (
            <div className="w-28 h-28 rounded-[32px] mx-auto mb-6 shadow-2xl shadow-violet-500/20 ring-1 ring-violet-400/30 overflow-hidden bg-white/5 backdrop-blur-xl">
              <img 
                src={specialist.clinica_logo_url!} 
                alt={specialist.clinica_nombre || "Logo"} 
                className="w-full h-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/20 ring-1 ring-violet-400/50">
              <span className="text-3xl font-black text-white">{specialist.nombre[0]}{specialist.apellido[0]}</span>
            </div>
          )}

          {/* Clinic Name */}
          {specialist.clinica_nombre && (
            <p className="text-violet-400/80 font-black uppercase tracking-[0.4em] text-[9px] mb-3">{specialist.clinica_nombre}</p>
          )}

          <p className="text-violet-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Reserva una cita con</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Dr. {specialist.nombre} {specialist.apellido}
          </h1>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {specialist.especialidades.map(esp => (
              <span key={esp} className="px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-xs font-bold uppercase tracking-wider">
                {esp}
              </span>
            ))}
          </div>

          {specialist.descripcion_perfil && (
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed mb-6">
              {specialist.descripcion_perfil}
            </p>
          )}

          {/* Dirección */}
          {specialist.clinica_direccion && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs mb-4">
              <MapPin size={14} className="text-violet-400/60" />
              <span>{specialist.clinica_direccion}</span>
            </div>
          )}

          {/* Redes Sociales */}
          {socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  className="p-3 bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 rounded-2xl text-slate-400 hover:text-violet-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-violet-500/10"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          )}
        </motion.header>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map(num => (
            <div key={num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step >= num ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "bg-white/5 text-slate-500"
              }`}>
                {step > num ? <CheckCircle2 size={16} /> : num}
              </div>
              {num < 3 && <div className={`w-12 h-0.5 rounded-full ${step > num ? "bg-violet-600" : "bg-white/5"}`} />}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">¿Qué servicio necesitas?</h2>
                <p className="text-slate-400 text-sm">Selecciona una de las opciones disponibles arriba.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialist.servicios.map(servicio => (
                  <button
                    key={servicio.id}
                    onClick={() => {
                      setSelectedService(servicio);
                      handleNext();
                    }}
                    className={`group p-6 rounded-3xl border transition-all text-left relative overflow-hidden ${
                      selectedService?.id === servicio.id 
                        ? "bg-violet-600/10 border-violet-500 shadow-xl shadow-violet-500/5" 
                        : "bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${selectedService?.id === servicio.id ? "bg-violet-600 text-white" : "bg-white/5 text-violet-400"}`}>
                        <Stethoscope size={20} />
                      </div>
                    </div>
                    <h3 className="font-bold text-white mb-2">{servicio.nombre}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest">
                      <Clock size={14} />
                      {servicio.duracion_estimada_min} MINUTOS
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleSubmit} className="glass-panel p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <button type="button" onClick={handleBack} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-2xl font-black text-white">Información de la Cita</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Nombre</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        required
                        className="booking-input"
                        placeholder="Tu nombre"
                        value={formData.nombre}
                        onChange={e => {
                          const val = e.target.value;
                          const formatted = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                          setFormData({...formData, nombre: formatted})
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Apellido</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        required
                        className="booking-input"
                        placeholder="Tu apellido"
                        value={formData.apellido}
                        onChange={e => {
                          const val = e.target.value;
                          const formatted = val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                          setFormData({...formData, apellido: formatted})
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Documento de Identidad</label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        required
                        className="booking-input"
                        placeholder="V-12345678"
                        pattern="^[VEP]-\d+$"
                        value={formData.documento}
                        onChange={e => {
                          let val = e.target.value.toUpperCase().replace(/\s/g, '');
                          if (/^\d/.test(val)) val = 'V-' + val;
                          if (/^[VEP]\d/.test(val)) val = val[0] + '-' + val.substring(1);
                          if (val.length > 0 && !/^[VEP-]/.test(val)) return;
                          setFormData({...formData, documento: val});
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        className="booking-input"
                        placeholder="+58 412 1234567"
                        value={formData.telefono}
                        onChange={e => setFormData({...formData, telefono: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="email"
                        className="booking-input"
                        placeholder="ejemplo@correo.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Fecha</label>
                    <input 
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="booking-input block w-full"
                      value={formData.fecha}
                      onChange={e => setFormData({...formData, fecha: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Hora</label>
                    <input 
                      type="time"
                      required
                      className="booking-input block w-full"
                      value={formData.hora}
                      onChange={e => setFormData({...formData, hora: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-violet-400/60 ml-1">Notas adicionales (opcional)</label>
                  <textarea 
                    className="booking-input min-h-[100px] resize-none pt-4"
                    placeholder="Cuéntanos el motivo de tu consulta..."
                    value={formData.notas}
                    onChange={e => setFormData({...formData, notas: e.target.value})}
                  />
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-400/60 uppercase tracking-widest">Servicio seleccionado</p>
                      <p className="font-bold text-emerald-400">{selectedService?.nombre}</p>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 hover:tracking-widest hover:scale-[1.01] transition-all text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-violet-500/20 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <>Confirmar Cita <ArrowRight size={20} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white/5 backdrop-blur-3xl rounded-[60px] border border-white/10 shadow-3xl"
            >
              <div className="w-24 h-24 bg-emerald-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-emerald-400">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight">¡Cita Agendada!</h2>
              <p className="text-slate-400 max-w-sm mx-auto mb-12">
                Su registro se ha completado. El Dr. {specialist.nombre} recibirá una notificación y confirmará su cita pronto.
              </p>
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-bold"
              >
                Volver al inicio
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-20 text-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <p className="text-[10px] uppercase font-black tracking-[0.5em] text-violet-400 mb-2">Powered by</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/img/logo/isotipo.png" 
                alt="VitalNexus" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-black text-white text-sm tracking-tighter">VitalNexus SaaS</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .booking-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          padding: 1rem 1rem 1rem 3rem;
          color: white;
          outline: none;
          transition: all 0.3s ease;
        }
        .booking-input:focus {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
