"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  ArrowRight,
  ChevronDown,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CategoriaGasto {
  id: string;
  nombre: string;
  especialista_id: string | null;
}

interface GastoFijo {
  id: string;
  categoria_id: string;
  categoria_nombre: string;
  descripcion: string | null;
  monto: number;
  fecha_pago: string;
  periodo_mes: number;
  periodo_anio: number;
  es_recurrente: boolean;
}

export default function GastosFijosPage() {
  const [gastos, setGastos] = useState<GastoFijo[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoFijo | null>(null);
  
  // Búsqueda de categorías
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Filtros de periodo
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Formulario
  const [formData, setFormData] = useState({
    categoria_id: "",
    descripcion: "",
    monto: "",
    fecha_pago: format(new Date(), "yyyy-MM-dd"),
    es_recurrente: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gastosRes, catsRes] = await Promise.all([
        api.get(`/api/gastos-fijos/?mes=${selectedMonth}&anio=${selectedYear}`),
        api.get("/api/gastos-fijos/categorias")
      ]);
      setGastos(gastosRes.data);
      setCategorias(catsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategorias = useMemo(() => {
    const search = categorySearch.toLowerCase();
    return categorias.filter(c => c.nombre.toLowerCase().includes(search));
  }, [categorias, categorySearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria_id) {
      alert("Por favor selecciona una categoría válida");
      return;
    }
    try {
      const payload = {
        ...formData,
        monto: parseFloat(formData.monto),
        periodo_mes: selectedMonth,
        periodo_anio: selectedYear
      };

      if (editingGasto) {
        await api.put(`/api/gastos-fijos/${editingGasto.id}`, payload);
      } else {
        await api.post("/api/gastos-fijos/", payload);
      }

      setIsModalOpen(false);
      setEditingGasto(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving gasto:", error);
      alert("Error al guardar el gasto");
    }
  };

  const resetForm = () => {
    setFormData({
      categoria_id: "",
      descripcion: "",
      monto: "",
      fecha_pago: format(new Date(), "yyyy-MM-dd"),
      es_recurrente: true
    });
    setCategorySearch("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este gasto?")) return;
    try {
      await api.delete(`/api/gastos-fijos/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting gasto:", error);
    }
  };

  const handleCreateCategory = async () => {
    if (!categorySearch.trim()) return;
    try {
      setIsCreatingCategory(true);
      const res = await api.post("/api/gastos-fijos/categorias", {
        nombre: categorySearch.trim()
      });
      const newCat = res.data;
      setCategorias([...categorias, newCat]);
      setFormData({...formData, categoria_id: newCat.id});
      setCategorySearch(newCat.nombre);
      setIsCategoryDropdownOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Error al crear la categoría");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const totalMensual = gastos.reduce((acc, g) => acc + g.monto, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Wallet size={28} />
            </div>
            Gastos Fijos Operativos
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Gestiona los costos fijos mensuales de tu clínica para calcular tu utilidad neta real.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGasto(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-primary text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      {/* ── Dashboard de Gastos ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card de Resumen */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 glass-panel p-8 rounded-[2.5rem] border-none bg-gradient-to-br from-rose-500/10 to-orange-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingDown size={120} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-1">Total Gastos Fijos</p>
              <h2 className="text-4xl font-black text-rose-500">{formatCurrency(totalMensual)}</h2>
              <p className="text-sm text-muted-foreground font-bold mt-1 uppercase tracking-tighter">
                Periodo: {format(new Date(selectedYear, selectedMonth - 1), "MMMM yyyy", { locale: es })}
              </p>
            </div>

            <div className="pt-6 border-t border-rose-500/10">
              <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                <AlertCircle size={18} className="text-rose-400" />
                <span>Este monto se restará automáticamente de tu utilidad neta en el dashboard.</span>
              </div>
            </div>

            {/* Selector de Periodo */}
            <div className="flex items-center gap-2 bg-background/40 p-2 rounded-2xl border border-white/5">
              <button 
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(v => v - 1);
                  } else {
                    setSelectedMonth(v => v - 1);
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 text-center text-xs font-black uppercase tracking-widest">
                {format(new Date(selectedYear, selectedMonth - 1), "MMM yyyy", { locale: es })}
              </div>
              <button 
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(v => v + 1);
                  } else {
                    setSelectedMonth(v => v + 1);
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Lista de Gastos */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-panel p-6 rounded-[2.5rem] border-none"
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="font-black text-lg flex items-center gap-2">
              Detalle de Egresos
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{gastos.length} registros</span>
            </h3>
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input 
                    type="text" 
                    placeholder="Buscar gasto..." 
                    className="pl-9 pr-4 py-2 bg-secondary/50 rounded-xl text-xs outline-none border border-transparent focus:border-primary/30 transition-all w-48"
                  />
               </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-xs">Sincronizando Gastos...</p>
              </div>
            ) : gastos.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border/10 rounded-[2rem] flex flex-col items-center gap-4">
                <Wallet className="text-muted-foreground/20" size={48} />
                <p className="text-muted-foreground font-medium italic">No hay gastos fijos registrados para este mes.</p>
                <button 
                   onClick={() => setIsModalOpen(true)}
                   className="text-xs font-black text-primary hover:underline uppercase tracking-widest"
                >
                  Registrar el primero
                </button>
              </div>
            ) : (
              gastos.map((g, i) => (
                <motion.div 
                  key={g.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-primary/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{g.categoria_nombre}</p>
                      {g.es_recurrente && (
                        <span className="text-[8px] font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/20">Recurrente</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{g.descripcion || "Sin descripción"}</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Pagado el {format(new Date(g.fecha_pago + 'T12:00:00'), "dd 'de' MMMM", { locale: es })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-rose-500 text-lg">{formatCurrency(g.monto)}</p>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      <button 
                        onClick={() => {
                          setEditingGasto(g);
                          setFormData({
                            categoria_id: g.categoria_id,
                            descripcion: g.descripcion || "",
                            monto: g.monto.toString(),
                            fecha_pago: g.fecha_pago,
                            es_recurrente: g.es_recurrente
                          });
                          setCategorySearch(g.categoria_nombre);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Modal de Gasto ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 rounded-[2.5rem] border-none shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    {editingGasto ? <Edit2 size={20} /> : <Plus size={20} />}
                  </div>
                  {editingGasto ? "Editar Gasto" : "Nuevo Gasto Mensual"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buscador de Categoría */}
                  <div className="space-y-1.5 relative" ref={categoryDropdownRef}>
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría</label>
                      <button 
                        type="button" 
                        onClick={handleCreateCategory}
                        className={`text-[9px] font-black uppercase text-primary hover:underline ${(!categorySearch || categorias.some(c => c.nombre.toLowerCase() === categorySearch.toLowerCase())) ? 'hidden' : ''}`}
                      >
                        + NUEVA
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        required
                        type="text"
                        placeholder="Buscar o crear categoría..."
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setIsCategoryDropdownOpen(true);
                          if (!e.target.value) setFormData({...formData, categoria_id: ""});
                        }}
                        onFocus={() => setIsCategoryDropdownOpen(true)}
                        className="w-full bg-secondary/50 border border-border/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold text-sm pr-10"
                      />
                      <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-2xl shadow-2xl z-[110] overflow-hidden"
                        >
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredCategorias.length === 0 ? (
                              <div className="p-4 text-center">
                                <p className="text-xs text-muted-foreground italic mb-2">No existe esta categoría</p>
                                <button 
                                  type="button"
                                  onClick={handleCreateCategory}
                                  className="w-full py-2 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                                >
                                  {isCreatingCategory ? <Loader2 size={14} className="animate-spin mx-auto" /> : `Crear "${categorySearch}"`}
                                </button>
                              </div>
                            ) : (
                              filteredCategorias.map(c => (
                                <button 
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({...formData, categoria_id: c.id});
                                    setCategorySearch(c.nombre);
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center transition-colors border-b border-border/5 last:border-0 ${formData.categoria_id === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}`}
                                >
                                  <span className="font-bold">{c.nombre}</span>
                                  {c.especialista_id && <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full uppercase">Personal</span>}
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monto (USD)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.monto}
                      onChange={(e) => setFormData({...formData, monto: e.target.value})}
                      className="w-full bg-secondary/50 border border-border/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descripción / Notas</label>
                  <input 
                    type="text"
                    placeholder="Ej. Pago correspondiente al mes actual..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="w-full bg-secondary/50 border border-border/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Pago</label>
                    <input 
                      required
                      type="date"
                      value={formData.fecha_pago}
                      onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                      className="w-full bg-secondary/50 border border-border/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold text-sm [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex items-end pb-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full p-1 transition-all ${formData.es_recurrente ? 'bg-primary' : 'bg-slate-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.es_recurrente ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={formData.es_recurrente}
                        onChange={(e) => setFormData({...formData, es_recurrente: e.target.checked})}
                      />
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Gasto Recurrente</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 sticky bottom-0 bg-card py-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-secondary/50 text-muted-foreground font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-secondary transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
                  >
                    {editingGasto ? "Actualizar" : "Guardar Registro"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
