"use client";

import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  CreditCard, 
  ShieldCheck,
  Menu,
  X,
  Bell,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Stethoscope,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading, logoutAdmin } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Actualizar hora cada minuto sin necesidad de alta precisión
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !admin && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [admin, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin && pathname !== "/admin/login") return null;
  if (pathname === "/admin/login") return <>{children}</>;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Users, label: "Especialistas", href: "/admin/especialistas" },
    { icon: Stethoscope, label: "Especialidades", href: "/admin/especialidades" },
    { icon: CreditCard, label: "Planes SaaS", href: "/admin/planes" },
    { icon: ShieldCheck, label: "Seguridad", href: "/admin/seguridad" },
    { icon: Settings, label: "Configuración", href: "/admin/config" },
  ];

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex flex-col items-center gap-4 text-center border-b border-outline-variant/20">
        <div className="w-16 h-16 bg-surface-container-highest/50 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/20 ring-1 ring-slate-200/50 dark:ring-white/10 overflow-hidden group hover:scale-105 transition-transform duration-500">
          <img 
            src="/img/logo/isotipo.png"
            alt="Admin Logo"
            className="w-full h-full object-cover p-2"
          />
        </div>
        <div className="overflow-hidden whitespace-nowrap">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-800 to-indigo-600 dark:from-white dark:to-violet-400 tracking-tighter">VITALNEXUS</h1>
          <p className="text-[10px] text-violet-700 dark:text-violet-400 font-black uppercase tracking-[0.3em] opacity-60">MASTER ADMIN PANEL</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? "bg-violet-600/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 shadow-[0_4px_20px_rgba(139,92,246,0.1)]" 
                  : "text-slate-500 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-500/5 hover:translate-x-1"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-violet-700 dark:text-violet-400" : "group-hover:text-violet-700 dark:text-violet-400 transition-colors"} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {isActive && (
                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,1)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-violet-500/5 rounded-3xl p-4 border border-violet-500/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-700 dark:text-violet-400 font-bold border border-violet-500/20 shrink-0">
              {admin?.nombre[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">{admin?.nombre} {admin?.apellido}</p>
              <p className="text-[10px] text-violet-700 dark:text-violet-400/60 truncate font-mono uppercase">Master Admin</p>
            </div>
          </div>
          <button 
            onClick={logoutAdmin}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/10 hover:bg-red-500/10 text-violet-700 dark:text-violet-400 hover:text-red-400 border border-violet-500/20 hover:border-red-500/20 transition-all font-bold text-xs"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden font-sans">
      {/* Sidebar Desktop (solo visible en lg+) */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="hidden lg:flex bg-surface-container-low/80 backdrop-blur-xl border-r border-outline-variant/10 flex-col relative z-20 overflow-hidden"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] lg:hidden"
            />
            {/* Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-surface-container-low z-[110] lg:hidden shadow-2xl flex flex-col border-r border-outline-variant/10"
            >
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 bg-surface-container-highest/50 rounded-xl text-on-surface-variant hover:text-on-surface active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
              <SidebarContent onClose={() => setIsMobileSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-xl border-b border-outline-variant/20 flex flex-col z-10 sticky top-0">
          
          {/* CINTILLO ADMIN (TOP HEADER) - solo desktop */}
          <div className="hidden md:flex items-center justify-between px-8 py-2 border-b border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-xl">
            <div className="flex items-center gap-6 text-[10px] text-violet-700 dark:text-violet-400/60 font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Phone className="w-2.5 h-2.5" /> +58 0412-4444621
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-2.5 h-2.5" /> smartlift1608@gmail.com
              </div>
            </div>
            <div className="flex items-center gap-6 text-[10px] text-violet-700 dark:text-violet-400/60 font-black uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <MapPin className="w-2.5 h-2.5" /> Valencia, Edo. Carabobo
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-2.5 h-2.5" /> {currentTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-2.5 h-2.5" /> {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="h-14 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              {/* Botón hamburguesa: en mobile abre overlay, en desktop colapsa sidebar */}
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileSidebarOpen(true);
                  } else {
                    setIsSidebarOpen(!isSidebarOpen);
                  }
                }}
                className="p-2.5 hover:bg-surface-container-highest/50 rounded-xl transition-colors text-on-surface-variant hover:text-on-surface"
              >
                <Menu size={22} />
              </button>
              <div className="h-6 w-[1px] bg-surface-container-highest" />
              {/* Logo visible solo en móvil en el header */}
              <div className="flex items-center gap-2 lg:hidden">
                <img src="/img/logo/isotipo.png" alt="VitalNexus" className="w-7 h-7 rounded-lg" />
                <span className="font-black text-sm text-violet-700 dark:text-violet-400 tracking-tighter">VitalNexus Admin</span>
              </div>
              <h2 className="hidden lg:block font-bold text-on-surface tracking-tight">
                {menuItems.find(i => i.href === pathname)?.label || "Panel Admin"}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Nombre de página en móvil */}
              <span className="lg:hidden text-xs font-bold text-on-surface-variant truncate max-w-[120px]">
                {menuItems.find(i => i.href === pathname)?.label || "Panel"}
              </span>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 hover:bg-surface-container-highest/50 rounded-xl transition-colors text-on-surface-variant hover:text-on-surface">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="relative p-2.5 hover:bg-surface-container-highest/50 rounded-xl transition-colors text-on-surface-variant hover:text-on-surface">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-background" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar relative">
          {/* Fondo Decorativo */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
