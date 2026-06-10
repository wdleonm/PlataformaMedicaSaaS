"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { 
  Users, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Package, 
  CreditCard,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  ShieldCheck,
  Wallet,
  Search,
  Bell,
  Plus,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Emergency Modal State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    motivo: ""
  });

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyForm.nombre || !emergencyForm.apellido || !emergencyForm.motivo) {
      toast.error("Nombre, Apellido y Motivo son obligatorios");
      return;
    }
    
    setIsSavingEmergency(true);
    try {
      // 1. Create a quick patient profile
      const emailDummy = `urgencia_${Date.now()}@emergencia.local`;
      const resPac = await api.post("/api/pacientes", {
        nombre: emergencyForm.nombre,
        apellido: emergencyForm.apellido,
        email: emailDummy,
        telefono: emergencyForm.telefono || "S/D",
        documento: "EMERGENCIA"
      });
      const pacienteId = resPac.data.id;

      // 2. Create the appointment immediately
      const date = new Date();
      await api.post("/api/citas", {
        paciente_id: pacienteId,
        especialista_id: null,
        fecha_hora: date.toISOString(),
        motivo: "URGENCIA: " + emergencyForm.motivo,
        estado: "programada",
        duracion_minutos: 30
      });

      toast.success("Paciente y Cita de Emergencia registrados exitosamente");
      setIsEmergencyModalOpen(false);
      setEmergencyForm({ nombre: "", apellido: "", telefono: "", motivo: "" });
      // Redirect to citas
      router.push("/citas");
    } catch (err: any) {
      toast.error("Error al registrar la emergencia");
      console.error(err);
    } finally {
      setIsSavingEmergency(false);
    }
  };

  // Efecto para sincronizar con el sistema o preferencia
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.push("/");
    }
  }, [usuario, isLoading, router]);

  // Guard de seguridad: Forzar cambio de contraseña
  useEffect(() => {
    if (!isLoading && usuario?.forzar_cambio_password_proximo_acceso && pathname !== "/seguridad") {
      router.push("/seguridad");
    }
  }, [usuario, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20"></div>
        <p className="mt-4 text-sm font-label-md text-on-surface-variant animate-pulse tracking-widest uppercase">Cargando Sistema...</p>
      </div>
    );
  }

  if (!usuario) return null;

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pacientes", href: "/pacientes", icon: Users },
    { name: "Agenda Médica", href: "/citas", icon: Calendar },
    { name: "Historias Clínicas", href: "/historias", icon: FileText },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Rentabilidad", href: "/presupuestos", icon: CreditCard },
    { name: "Gastos Fijos", href: "/gastos-fijos", icon: Wallet },
    { name: "Comunicaciones", href: "/comunicaciones", icon: MessageSquare },
    { name: "Seguridad", href: "/seguridad", icon: ShieldCheck },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface-container-low">
      <div className="px-6 mb-8 pt-6">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/img/logo/isotipo.png" 
            alt="VitalNexus Logo" 
            className="h-8 w-auto object-contain"
          />
          <span className="font-headline-md text-headline-md font-bold text-on-surface">
            VITAL<span className="text-primary">NEXUS</span>
          </span>
        </Link>
        <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60 mt-2">Clinical Management</p>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 px-6 py-2.5 transition-all duration-200 group font-label-md text-label-md ${
                isActive 
                  ? "text-primary bg-primary/10 dark:bg-primary/15 border-r-4 border-primary" 
                  : "text-on-surface-variant hover:bg-surface-container-highest/40"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary transition-colors"} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto px-4 pt-6 pb-6 border-t border-outline-variant/10">
        <button className="w-full bg-primary/10 text-primary py-2.5 font-label-md text-label-md rounded-sm hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2 mb-6">
          <Plus size={18} />
          Nueva Cita
        </button>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-2 py-2 text-on-surface-variant hover:bg-surface-container-highest/40 transition-all duration-200 font-label-md text-label-md rounded-lg group"
        >
          <LogOut size={20} className="text-on-surface-variant group-hover:text-error transition-colors" />
          <span className="group-hover:text-error transition-colors">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-on-background font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-outline-variant/20 bg-surface-container-low flex-col fixed left-0 top-0 bottom-0 z-40 transition-all shrink-0">
        <SidebarContent />
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        
        {/* Top Nav Bar (Desktop & Mobile Unified) */}
        <header className="flex justify-between items-center px-4 md:px-6 w-full sticky top-0 z-30 bg-background/50 backdrop-blur-[3px] h-16 border-b border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-on-surface-variant hover:text-primary active:scale-90 transition-all"
            >
              <Menu size={24} />
            </button>

            {/* Global Search */}
            <div className="hidden md:flex items-center bg-surface-container-highest/40 px-4 py-1.5 rounded-full border border-outline-variant/20 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}>
              <Search size={16} className="text-outline mr-2" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-48 lg:w-64 placeholder:text-on-surface-variant/50 outline-none text-on-surface cursor-pointer" 
                placeholder="Buscar pacientes, historias..." 
                type="text" 
                readOnly
                onFocus={(e) => {
                  e.target.blur();
                  window.dispatchEvent(new CustomEvent("open-command-palette"));
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setIsEmergencyModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 border border-red-500/40 bg-red-500/10 text-red-500 font-bold text-xs rounded-lg hover:bg-red-500/20 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              title="Registrar paciente de urgencia"
            >
              <AlertTriangle size={14} />
              Emergencia
            </button>
            
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-on-surface-variant hover:text-primary transition-colors"
                title="Cambiar Tema"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button className="text-on-surface-variant hover:text-primary transition-colors relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full animate-pulse"></span>
              </button>

              <Link href="/configuracion" className="text-on-surface-variant hover:text-primary transition-colors">
                <Settings size={20} />
              </Link>
              
              {/* User Avatar */}
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30 cursor-pointer shadow-[0_0_10px_rgba(76,215,246,0.1)]">
                <span className="text-xs font-bold text-primary">{usuario.nombre[0]}{usuario.apellido[0]}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background relative custom-scrollbar scroll-smooth">
          {/* Decoración de fondo Modernista Stitch */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
          
          <div className="relative p-4 md:p-6 lg:p-8 max-w-7xl mx-auto z-10 space-y-6">
              {children}
          </div>
        </main>
      </div>

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/50 backdrop-blur-[3px] z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-surface-container-low z-[110] lg:hidden shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-6 p-2 bg-surface-container-highest rounded-xl text-on-surface-variant hover:text-on-surface active:scale-90 transition-all z-50"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isEmergencyModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsEmergencyModalOpen(false)}
              className="absolute inset-0 bg-background/50 backdrop-blur-[3px]" 
            />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-md rounded-[2.5rem] border-none shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/30 bg-red-500/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 text-red-500 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-red-500">Ingreso Rápido</h2>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Cita de Emergencia</p>
                  </div>
                </div>
                <button onClick={() => setIsEmergencyModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-highest transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEmergencySubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Nombre *</label>
                    <input required type="text" className="w-full bg-surface border border-outline-variant/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500/50" value={emergencyForm.nombre} onChange={e => setEmergencyForm({...emergencyForm, nombre: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Apellido *</label>
                    <input required type="text" className="w-full bg-surface border border-outline-variant/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500/50" value={emergencyForm.apellido} onChange={e => setEmergencyForm({...emergencyForm, apellido: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Teléfono (Opcional)</label>
                  <input type="text" className="w-full bg-surface border border-outline-variant/50 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500/50" value={emergencyForm.telefono} onChange={e => setEmergencyForm({...emergencyForm, telefono: e.target.value})} placeholder="Ej: 0414-1234567" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Motivo de Urgencia *</label>
                  <textarea required className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-red-500/50 resize-none h-24" value={emergencyForm.motivo} onChange={e => setEmergencyForm({...emergencyForm, motivo: e.target.value})} placeholder="Trauma dental, dolor agudo..." />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/30">
                  <button type="button" onClick={() => setIsEmergencyModalOpen(false)} className="flex-1 py-4 bg-surface-container-highest/50 text-on-surface-variant font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-surface-container-highest transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSavingEmergency} className="flex justify-center items-center gap-2 flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50">
                    {isSavingEmergency ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                    Registrar Ingreso
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CommandPalette />
    </div>
  );
}
