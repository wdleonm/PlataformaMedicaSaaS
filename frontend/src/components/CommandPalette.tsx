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
  const [searchResults, setSearchResults] = useState<{
    pacientes: any[];
    servicios: any[];
    insumos: any[];
    citas: any[];
  }>({
    pacientes: [],
    servicios: [],
    insumos: [],
    citas: []
  });
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  // Helper para aplanar resultados
  const getFlatItems = useCallback(() => {
    const items: { id: string; type: string; title: string; subtitle: string; href: string; original: any }[] = [];
    searchResults.pacientes.forEach(p => {
      items.push({
        id: p.id,
        type: "paciente",
        title: `${p.nombre} ${p.apellido}`,
        subtitle: `ID: ${p.documento || "Sin Documento"}`,
        href: `/historias?paciente_id=${p.id}`,
        original: p
      });
    });
    searchResults.servicios.forEach(s => {
      items.push({
        id: s.id,
        type: "servicio",
        title: s.nombre,
        subtitle: `Código: ${s.codigo} • Precio: $${s.precio}`,
        href: `/inventario?tab=servicios&search=${encodeURIComponent(s.nombre)}`,
        original: s
      });
    });
    searchResults.insumos.forEach(i => {
      items.push({
        id: i.id,
        type: "insumo",
        title: i.nombre,
        subtitle: `Código: ${i.codigo} • Stock: ${i.stock_actual} ${i.unidad}`,
        href: `/inventario?tab=insumos&search=${encodeURIComponent(i.nombre)}`,
        original: i
      });
    });
    searchResults.citas.forEach(c => {
      const pac = allPatients.find(p => p.id === c.paciente_id);
      const formattedDate = new Date(c.fecha_hora).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      items.push({
        id: c.id,
        type: "cita",
        title: `Cita: ${pac ? `${pac.nombre} ${pac.apellido}` : "Paciente Desconocido"}`,
        subtitle: `Fecha: ${formattedDate} • Estado: ${c.estado}`,
        href: "/citas",
        original: c
      });
    });
    return items;
  }, [searchResults, allPatients]);

  const flatItems = getFlatItems();

  // Resetear el foco visual cuando cambia la búsqueda o la query
  useEffect(() => {
    setActiveIndex(0);
  }, [searchResults, query]);

  // Obtener índice plano por categoría
  const getFlatIndex = (category: "paciente" | "servicio" | "insumo" | "cita", indexInCategory: number) => {
    let index = 0;
    if (category === "paciente") {
      index = indexInCategory;
    } else if (category === "servicio") {
      index = searchResults.pacientes.length + indexInCategory;
    } else if (category === "insumo") {
      index = searchResults.pacientes.length + searchResults.servicios.length + indexInCategory;
    } else if (category === "cita") {
      index = searchResults.pacientes.length + searchResults.servicios.length + searchResults.insumos.length + indexInCategory;
    }
    return index;
  };

  // Manejo de eventos de teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const activeItem = flatItems[activeIndex];
      if (activeItem) {
        handleSelect(activeItem.href);
      }
    }
  };

  // Atajo Ctrl+K y Evento Personalizado para abrir
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    const handleOpen = () => setIsOpen(true);
    
    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", handleOpen);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", handleOpen);
    };
  }, []);

  // Cargar todos los pacientes para el mapeo de nombres de citas
  useEffect(() => {
    if (isOpen) {
      api.get("/api/pacientes?limit=500")
        .then((res) => setAllPatients(res.data.items || []))
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  // Búsqueda cruzada
  useEffect(() => {
    if (!query) {
      setSearchResults({ pacientes: [], servicios: [], insumos: [], citas: [] });
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const [pacientesRes, serviciosRes, insumosRes, citasRes] = await Promise.all([
          api.get(`/api/pacientes/?skip=0&limit=10&search=${query}`),
          api.get(`/api/servicios?skip=0&limit=10&q=${query}`),
          api.get(`/api/insumos?skip=0&limit=10&q=${query}`),
          api.get(`/api/citas?limit=100`)
        ]);

        const patientsList = pacientesRes.data.items || [];
        const servicesList = serviciosRes.data.items || [];
        const suppliesList = insumosRes.data.items || [];

        const term = query.toLowerCase();
        const appointmentsList = (citasRes.data.items || []).filter((c: any) => {
          const pac = allPatients.find(p => p.id === c.paciente_id) || patientsList.find((p: any) => p.id === c.paciente_id);
          const pacName = pac ? `${pac.nombre} ${pac.apellido}`.toLowerCase() : "";
          const notas = (c.notas || "").toLowerCase();
          return pacName.includes(term) || notas.includes(term);
        }).slice(0, 5);

        setSearchResults({
          pacientes: patientsList,
          servicios: servicesList,
          insumos: suppliesList,
          citas: appointmentsList
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, allPatients]);

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
                  onKeyDown={handleKeyDown}
                />
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 text-[10px] font-black tracking-tight">
                  <Command size={10} /> K
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3">
                {query ? (
                  <div className="space-y-6">
                    {loading && (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm animate-pulse">Buscando en la base de datos...</div>
                    )}

                    {!loading && 
                     searchResults.pacientes.length === 0 && 
                     searchResults.servicios.length === 0 && 
                     searchResults.insumos.length === 0 && 
                     searchResults.citas.length === 0 && (
                      <div className="px-4 py-12 text-center">
                        <p className="text-slate-400 text-sm font-medium">No se encontraron resultados para &quot;{query}&quot;.</p>
                      </div>
                    )}

                    {/* PACIENTES */}
                    {!loading && searchResults.pacientes.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800/40 pb-1">Pacientes</p>
                        {searchResults.pacientes.map((p, idx) => {
                          const flatIdx = getFlatIndex("paciente", idx);
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button 
                              key={p.id}
                              onClick={() => handleSelect(`/historias?paciente_id=${p.id}`)}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl group transition-all text-left border ${
                                isHighlighted 
                                  ? "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-900 dark:text-violet-200 shadow-[0_4px_12px_rgba(139,92,246,0.05)]" 
                                  : "border-transparent hover:bg-violet-50 dark:hover:bg-violet-500/10"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-600 transition-transform group-hover:scale-110">
                                  <Users size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{p.nombre} {p.apellido}</p>
                                  <p className="text-xs text-slate-500">ID: {p.documento || "Sin Documento"}</p>
                                </div>
                              </div>
                              <ArrowRight className="text-slate-300 group-hover:text-violet-500 transition-all group-hover:translate-x-1" size={16} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* SERVICIOS */}
                    {!loading && searchResults.servicios.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800/40 pb-1">Servicios / Tratamientos</p>
                        {searchResults.servicios.map((s, idx) => {
                          const flatIdx = getFlatIndex("servicio", idx);
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button 
                              key={s.id}
                              onClick={() => handleSelect(`/inventario?tab=servicios&search=${encodeURIComponent(s.nombre)}`)}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl group transition-all text-left border ${
                                isHighlighted 
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.05)]" 
                                  : "border-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                                  <Zap size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{s.nombre}</p>
                                  <p className="text-xs text-slate-500">Código: {s.codigo} • Precio: ${s.precio}</p>
                                </div>
                              </div>
                              <ArrowRight className="text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" size={16} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* INSUMOS */}
                    {!loading && searchResults.insumos.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800/40 pb-1">Insumos</p>
                        {searchResults.insumos.map((i, idx) => {
                          const flatIdx = getFlatIndex("insumo", idx);
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button 
                              key={i.id}
                              onClick={() => handleSelect(`/inventario?tab=insumos&search=${encodeURIComponent(i.nombre)}`)}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl group transition-all text-left border ${
                                isHighlighted 
                                  ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-[0_4px_12px_rgba(245,158,11,0.05)]" 
                                  : "border-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                                  <Package size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{i.nombre}</p>
                                  <p className="text-xs text-slate-500">Código: {i.codigo} • Stock: {i.stock_actual} {i.unidad}</p>
                                </div>
                              </div>
                              <ArrowRight className="text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" size={16} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* CONSULTAS / CITAS */}
                    {!loading && searchResults.citas.length > 0 && (
                      <div className="space-y-1">
                        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800/40 pb-1">Consultas / Citas</p>
                        {searchResults.citas.map((c, idx) => {
                          const pac = allPatients.find(p => p.id === c.paciente_id);
                          const formattedDate = new Date(c.fecha_hora).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          const flatIdx = getFlatIndex("cita", idx);
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button 
                              key={c.id}
                              onClick={() => handleSelect("/citas")}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl group transition-all text-left border ${
                                isHighlighted 
                                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-200 shadow-[0_4px_12px_rgba(59,130,246,0.05)]" 
                                  : "border-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
                                  <Calendar size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">Cita: {pac ? `${pac.nombre} ${pac.apellido}` : "Paciente Desconocido"}</p>
                                  <p className="text-xs text-slate-500">Fecha: {formattedDate} • Estado: <span className="capitalize">{c.estado}</span></p>
                                </div>
                              </div>
                              <ArrowRight className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" size={16} />
                            </button>
                          );
                        })}
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
