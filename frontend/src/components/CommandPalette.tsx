"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  Package,
  Plus, 
  Zap,
  Command,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface SearchResult {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Atajo Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Búsqueda de pacientes
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/pacientes/?skip=0&limit=5&search=${query}`);
        setResults(data.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Gatillo visual opcional en el header si se desea, pero Ctrl+K es el principal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <Search className="text-slate-400" size={24} />
                <input 
                  autoFocus
                  placeholder="Buscar pacientes, módulos o acciones rápidas..."
                  className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 text-[10px] font-black tracking-tight">
                  <Command size={10} /> K
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3">
                {query ? (
                  <div className="space-y-1">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resultados de Pacientes</p>
                    {loading ? (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm animate-pulse">Buscando en la base de datos...</div>
                    ) : results.length > 0 ? (
                      results.map((p) => (
                        <button 
                          key={p.id}
                          onClick={() => handleSelect(`/historias?paciente_id=${p.id}`)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-500/10 group transition-all text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-600 transition-transform group-hover:scale-110">
                              <Users size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{p.nombre} {p.apellido}</p>
                              <p className="text-xs text-slate-500">ID: {p.documento}</p>
                            </div>
                          </div>
                          <ArrowRight className="text-slate-300 group-hover:text-violet-500 transition-all group-hover:translate-x-1" size={18} />
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-12 text-center">
                        <p className="text-slate-400 text-sm font-medium">No se encontraron pacientes similares.</p>
                        <button onClick={() => handleSelect("/pacientes")} className="mt-4 text-violet-500 font-black text-[10px] uppercase tracking-widest hover:underline">Ir a Gestión de Pacientes</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 p-2">
                    <div className="space-y-1">
                      <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sugerencias</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: "Ver Agenda", icon: Calendar, href: "/citas", color: "text-blue-500" },
                          { name: "Registrar Paciente", icon: Plus, href: "/pacientes", color: "text-emerald-500" },
                          { name: "Ver Inventario", icon: Package, href: "/inventario", color: "text-amber-500" },
                          { name: "Presupuestos", icon: CreditCard, href: "/presupuestos", color: "text-rose-500" },
                        ].map((item) => (
                          <button 
                            key={item.href}
                            onClick={() => handleSelect(item.href)}
                            className="flex items-center gap-3 p-3.5 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left"
                          >
                            <div className={`p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm ${item.color} group-hover:scale-110 transition-transform`}>
                              <item.icon size={18} />
                            </div>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-violet-600/10 border border-violet-600/20 rounded-[28px] flex items-center gap-4">
                      <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
                        <Zap size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-violet-600 text-xs uppercase tracking-widest">Tip Inteligente</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Usa las flechas del teclado para navegar y Enter para saltar directamente al módulo deseado.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Presiona ESC para cerrar</span>
                <span className="flex items-center gap-2">OdontoFocus <Zap size={10} className="text-violet-500" /> Command</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
