"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20"></div>
        <p className="mt-4 text-sm font-bold text-muted-foreground animate-pulse tracking-widest uppercase">Cargando Sistema...</p>
      </div>
    );
  }

  if (!usuario) return null;

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pacientes", href: "/pacientes", icon: Users },
    { name: "Citas", href: "/citas", icon: Calendar },
    { name: "Historias Clínicas", href: "/historias", icon: FileText },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Finanzas", href: "/presupuestos", icon: CreditCard },
    { name: "Comunicaciones", href: "/comunicaciones", icon: MessageSquare },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <Link href="/dashboard" className="font-bold text-2xl text-primary mb-10 tracking-tight flex items-center gap-2 px-2 hover:scale-105 transition-transform">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <span className="text-xl">o</span>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground leading-none">Odonto</span>
            <span className="text-primary text-[10px] uppercase tracking-[0.2em] font-black">Focus SaaS</span>
          </div>
      </Link>
      
      <nav className="space-y-1 flex-1 relative custom-scrollbar overflow-y-auto pr-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group min-h-[44px] ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-5px_rgba(14,165,233,0.3)]" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-white" : "text-primary/70 group-hover:text-primary transition-colors"} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-border/10 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary transition-all active:scale-95"
              title="Cambiar Tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2.5 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary transition-all active:scale-95">
              <Settings size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-2xl border border-border/5 group cursor-default">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {usuario.nombre[0]}{usuario.apellido[0]}
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">{usuario.nombre} {usuario.apellido}</p>
                  <p className="text-[9px] text-primary truncate uppercase tracking-widest font-black mt-0.5">Especialista</p>
              </div>
              <button 
                onClick={logout} 
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
          </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar Desktop */}
      <aside className="w-72 border-r border-border/30 bg-card p-6 hidden lg:flex flex-col shadow-2xl relative z-40 transition-all shrink-0">
        <SidebarContent />
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/10 bg-card/80 backdrop-blur-xl z-30">
          <Link href="/dashboard" className="font-black text-lg text-primary tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">O</div>
            <span>Odonto-Focus</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-secondary rounded-xl text-muted-foreground active:scale-90 transition-all"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/50 relative custom-scrollbar scroll-smooth">
          {/* Decoración de fondo Modernista */}
          <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full -mr-64 -mt-64 pointer-events-none z-0" />
          <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none z-0" />
          
          <div className="relative p-4 md:p-8 lg:p-10 max-w-7xl mx-auto z-10">
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-card p-6 z-[110] lg:hidden shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-6 p-2 bg-secondary/50 rounded-xl text-muted-foreground hover:text-foreground active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
