"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Stethoscope, 
  FileText, 
  Package, 
  CreditCard,
  MessageSquare,
  LogOut,
  LayoutDashboard
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuario, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.push("/");
    }
  }, [usuario, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-[50%] animate-spin"></div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Pacientes", href: "/pacientes", icon: Users },
    { name: "Citas", href: "/citas", icon: Calendar },
    { name: "Odontograma", href: "/odontograma", icon: Stethoscope },
    { name: "Historias Clínicas", href: "/historias", icon: FileText },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Pagos y Presupuestos", href: "/presupuestos", icon: CreditCard },
    { name: "Comunicaciones", href: "/comunicaciones", icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Lateral */}
      <aside className="w-72 border-r border-border/10 bg-card p-6 hidden lg:flex flex-col shadow-sm z-10 glass-panel border-none h-screen transition-all">
        <Link href="/dashboard" className="font-bold text-2xl text-primary mb-10 tracking-tight flex items-center gap-2 px-2">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">O</span>
            <span>Odonto<span className="text-foreground">-Focus</span></span>
        </Link>
        
        <nav className="space-y-1.5 flex-1 relative custom-scrollbar overflow-y-auto pr-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-white" : "text-primary group-hover:scale-110 transition-transform"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-6 pt-6 border-t border-border/10 flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {usuario.nombre[0]}{usuario.apellido[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{usuario.nombre} {usuario.apellido}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-bold mt-0.5">Especialista</p>
                </div>
            </div>
            <button 
               onClick={logout} 
               className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-all font-semibold group">
               <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
               Cerrar Sesión
            </button>
        </div>
      </aside>
      
      {/* Contenido Dinámico */}
      <main className="flex-1 overflow-y-auto bg-background/50 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="relative p-6 md:p-10 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
