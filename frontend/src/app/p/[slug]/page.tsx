"use client";

import { toast } from 'react-hot-toast';
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
  mostrar_precios_portal: boolean;
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
      toast.error("El documento debe tener el formato V-12345678, E-12345678 o P-12345678 (Letra en mayúscula y con guion).");
      setSubmitting(false);
      return;
    }

    if (!formData.email && !formData.telefono) {
      toast.error("Debes proporcionar al menos un medio de contacto (Correo o Teléfono).");
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
      toast.error("Error al agendar la cita. Por favor verifique los datos o intente más tarde.");
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 dark">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-primary font-label-md animate-pulse tracking-widest uppercase text-xs">Cargando Portal...</p>
    </div>
  );

  if (error || !specialist) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center dark">
      <div className="w-20 h-20 bg-error-container rounded-3xl flex items-center justify-center mb-6 border border-error/20">
        <Info className="text-error" size={40} />
      </div>
      <h1 className="text-2xl font-headline-md text-on-surface mb-2">Portal no disponible</h1>
      <p className="text-on-surface-variant max-w-sm mb-8 font-body-sm">El enlace que has seguido no es válido o el especialista ha desactivado su portal de reservas.</p>
      <button onClick={() => window.history.back()} className="px-6 py-3 bg-surface-container-highest hover:bg-surface-container-high text-on-surface rounded-2xl transition-all font-label-md">Volver atrás</button>
    </div>
  );

  const hasLogo = specialist.clinica_logo_url && specialist.clinica_logo_url.length > 5;

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary/30 dark">
      {/* Background Decor (Cyan Glow) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
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
            <div className="w-28 h-28 rounded-[32px] mx-auto mb-6 shadow-2xl shadow-primary/20 ring-1 ring-primary/30 overflow-hidden bg-surface-container-low backdrop-blur-xl">
              <img 
                src={specialist.clinica_logo_url!} 
                alt={specialist.clinica_nombre || "Logo"} 
                className="w-full h-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 ring-1 ring-primary/50">
              <span className="text-3xl font-headline-lg text-on-primary">{specialist.nombre[0]}{specialist.apellido[0]}</span>
            </div>
          )}

          {/* Clinic Name */}
          {specialist.clinica_nombre && (
            <p className="text-primary/80 font-black uppercase tracking-[0.4em] text-[9px] mb-3">{specialist.clinica_nombre}</p>
          )}

          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-2">Reserva una cita con</p>
          <h1 className="text-4xl md:text-5xl font-headline-lg text-on-surface tracking-tight mb-4">
            Dr. {specialist.nombre} {specialist.apellido}
          </h1>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {specialist.especialidades.map(esp => (
              <span key={esp} className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-label-md uppercase tracking-wider">
                {esp}
              </span>
            ))}
          </div>

          {specialist.descripcion_perfil && (
            <p className="text-on-surface-variant max-w-xl mx-auto text-sm font-body-sm leading-relaxed mb-6">
              {specialist.descripcion_perfil}
            </p>
          )}

          {/* Dirección */}
          {specialist.clinica_direccion && (
            <div className="flex items-center justify-center gap-2 text-on-surface-variant text-xs font-label-md mb-4">
              <MapPin size={14} className="text-primary/60" />
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
                  className="p-3 bg-surface-container-low hover:bg-primary/20 border border-outline-variant/20 hover:border-primary/40 rounded-2xl text-on-surface-variant hover:text-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/10"
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-label-md transition-all ${
                step >= num ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-surface-container-highest text-on-surface-variant"
              }`}>
                {step > num ? <CheckCircle2 size={16} /> : num}
              </div>
              {num < 3 && <div className={`w-12 h-0.5 rounded-full ${step > num ? "bg-primary" : "bg-surface-container-highest"}`} />}
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
                <h2 className="text-2xl font-headline-md text-on-surface">¿Qué servicio necesitas?</h2>
                <p className="text-on-surface-variant text-sm font-body-sm mt-1">Selecciona una de las opciones disponibles arriba.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialist.servicios.map(servicio => (
                  <button
                    key={servicio.id}
                    onClick={() => {
                      setSelectedService(servicio);
                      handleNext();
                    }}
                    className={`group p-6 rounded-3xl border transition-all text-left relative overflow-hidden glass-panel ${
                      selectedService?.id === servicio.id 
                        ? "bg-primary/10 border-primary shadow-xl shadow-primary/5" 
                        : "bg-surface-container-low border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${selectedService?.id === servicio.id ? "bg-primary text-on-primary" : "bg-surface-container-highest text-primary"}`}>
                        <Stethoscope size={20} />
                      </div>
                      {specialist.mostrar_precios_portal && servicio.precio > 0 && (
                        <span className="text-lg font-headline-md text-primary">${servicio.precio.toFixed(2)}</span>
                      )}
                    </div>
                    <h3 className="font-label-md text-on-surface mb-2">{servicio.nombre}</h3>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant font-label-md uppercase tracking-widest">
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
              <form onSubmit={handleSubmit} className="glass-panel p-8 md:p-12 rounded-[40px] border border-outline-variant/20 shadow-2xl space-y-8 bg-surface-container-low">
                <div className="flex items-center gap-4 mb-4">
                  <button type="button" onClick={handleBack} className="p-2 hover:bg-surface-container-highest rounded-xl transition-all">
                    <ChevronLeft size={20} className="text-on-surface" />
                  </button>
                  <h2 className="text-2xl font-headline-md text-on-surface">Información de la Cita</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Nombre</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
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
                    <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Apellido</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
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
                    <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Documento de Identidad</label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
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
                    <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                      <input 
                        className="booking-input"
                        placeholder="+58 412 1234567"
                        value={formData.telefono}
                        onChange={e => setFormData({...formData, telefono: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
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
                    <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Fecha</label>
                    <input 
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="booking-input block w-full [color-scheme:dark]"
                      value={formData.fecha}
                      onChange={e => setFormData({...formData, fecha: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Hora</label>
                    <input 
                      type="time"
                      required
                      className="booking-input block w-full [color-scheme:dark]"
                      value={formData.hora}
                      onChange={e => setFormData({...formData, hora: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-label-md uppercase tracking-widest text-primary/60 ml-1">Notas adicionales (opcional)</label>
                  <textarea 
                    className="booking-input min-h-[100px] resize-none pt-4"
                    placeholder="Cuéntanos el motivo de tu consulta..."
                    value={formData.notas}
                    onChange={e => setFormData({...formData, notas: e.target.value})}
                  />
                </div>

                <div className="bg-success/5 border border-success/20 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-success/20 rounded-xl text-success">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-label-md text-success/60 uppercase tracking-widest">Servicio seleccionado</p>
                      <p className="font-headline-md text-success">{selectedService?.nombre}</p>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full h-16 bg-primary hover:tracking-widest hover:scale-[1.01] transition-all text-on-primary font-headline-md rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
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
              className="text-center py-20 bg-surface-container-low backdrop-blur-3xl rounded-[60px] border border-outline-variant/20 shadow-3xl glass-panel"
            >
              <div className="w-24 h-24 bg-success/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-success">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-4xl font-headline-lg text-on-surface mb-4 tracking-tight">¡Cita Agendada!</h2>
              <p className="text-on-surface-variant max-w-sm mx-auto mb-12 font-body-md">
                Su registro se ha completado. El Dr. {specialist.nombre} recibirá una notificación y confirmará su cita pronto.
              </p>
              <button 
                onClick={() => setStep(1)}
                className="px-8 py-4 bg-surface-container-highest hover:bg-surface-container text-on-surface rounded-2xl transition-all font-label-md"
              >
                Volver al inicio
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-20 text-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <p className="text-[10px] uppercase font-label-md tracking-[0.5em] text-primary mb-2">Powered by</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-surface-container-highest rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/img/logo/isotipo.png" 
                alt="VitalNexus" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-headline-md text-on-surface text-sm tracking-tighter">VitalNexus SaaS</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .booking-input {
          width: 100%;
          background: var(--surface-container-highest);
          border: 1px solid var(--outline-variant);
          border-radius: 1rem;
          padding: 1rem 1rem 1rem 3rem;
          color: var(--on-surface);
          outline: none;
          transition: all 0.3s ease;
        }
        .booking-input:focus {
          border-color: var(--primary);
          background: rgba(76, 215, 246, 0.05); /* Cyan tint */
          box-shadow: 0 0 20px rgba(76, 215, 246, 0.1);
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
