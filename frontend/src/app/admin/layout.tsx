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
  Bell
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, isLoading, logoutAdmin } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Si no hay admin y no estamos en login, no renderizar nada mientras redirige
  if (!admin && pathname !== "/admin/login") return null;

  // Si es login, no mostrar el layout de admin
  if (pathname === "/admin/login") return <>{children}</>;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Users, label: "Especialistas", href: "/admin/especialistas" },
    { icon: CreditCard, label: "Planes SaaS", href: "/admin/planes" },
    { icon: ShieldCheck, label: "Seguridad", href: "/admin/seguridad" },
    { icon: Settings, label: "Configuración", href: "/admin/config" },
  ];

  return (
    <div className="flex h-screen bg-[#0a0514] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-[#130b22] border-r border-violet-500/10 flex flex-col relative z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <img 
            src="/img/logo/isotipo.png"
            alt="Admin Logo"
            className="w-12 h-12 rounded-xl shadow-lg shadow-violet-500/30 ring-1 ring-violet-500/20"
          />
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-400">ADMIN SaaS</h1>
            <p className="text-[10px] text-violet-400/60 uppercase tracking-[0.2em] font-bold">VitalNexus Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? "bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.05)]" 
                    : "text-slate-500 hover:text-violet-300 hover:bg-violet-500/5 hover:translate-x-1"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-violet-400" : "group-hover:text-violet-400 transition-colors"} />
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
              <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold border border-violet-500/20">
                {admin?.nombre[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{admin?.nombre} {admin?.apellido}</p>
                <p className="text-[10px] text-violet-400/60 truncate font-mono uppercase">Master Admin</p>
              </div>
            </div>
            <button 
              onClick={logoutAdmin}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/10 hover:bg-red-500/10 text-violet-400 hover:text-red-400 border border-violet-500/20 hover:border-red-500/20 transition-all font-bold text-xs"
            >
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#0a0514]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
              <Menu size={22} />
            </button>
            <div className="h-6 w-[1px] bg-white/10" />
            <h2 className="font-bold text-slate-200">
              {menuItems.find(i => i.href === pathname)?.label || "Panel Admin"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full border-2 border-[#0a0514]" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
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
