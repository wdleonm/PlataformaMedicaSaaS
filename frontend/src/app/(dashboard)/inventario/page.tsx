"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Package, 
  Plus, 
  Search, 
  Loader2, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle, 
  Settings2, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  FlaskConical,
  Stethoscope,
  Info,
  Minus,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Insumo {
  id: string;
  nombre: string;
  codigo: string | null;
  unidad: string;
  costo_unitario: number;
  unidades_por_paquete: number;
  costo_por_unidad: number;
  stock_actual: number;
  stock_minimo: number;
  stock_bajo: boolean;
}

interface InsumoReceta {
  insumo_id: string;
  insumo_nombre: string;
  insumo_unidad: string;
  cantidad_utilizada: number;
  costo_linea: number;
}

interface Servicio {
  id: string;
  nombre: string;
  codigo: string | null;
  precio: number;
  costo_insumos: number;
  utilidad_neta: number;
  insumos: InsumoReceta[];
}

interface CatalogoInsumo {
  id: string;
  sku: string | null;
  nombre: string;
  categoria: string | null;
  precio_usd: number;
  unidades: number;
  imagen_url: string | null;
  enlace_origen: string | null;
}

const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  step = 1, 
  min = 0, 
  prefix = "" 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  step?: number; 
  min?: number;
  prefix?: string;
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">{label}</label>
      <div className="flex items-center gap-1 bg-background border border-border/50 rounded-xl p-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <button 
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-lg text-muted-foreground transition-colors active:scale-90"
        >
          <Minus size={16} />
        </button>
        <div className="flex-1 relative">
          {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">{prefix}</span>}
          <input 
            type="number" 
            step={step}
            className={`w-full bg-transparent text-center font-bold text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${prefix ? 'pl-6' : ''}`}
            value={value === 0 ? '' : value}
            onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          />
        </div>
        <button 
          type="button"
          onClick={() => onChange(value + step)}
          className="w-10 h-10 flex items-center justify-center hover:bg-secondary rounded-lg text-primary transition-colors active:scale-90"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<"insumos" | "servicios">("insumos");
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modales
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [isServicioModalOpen, setIsServicioModalOpen] = useState(false);
  const [isRecetaModalOpen, setIsRecetaModalOpen] = useState(false);

  // Estados de Edición
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Formulario Insumo
  const [insumoForm, setInsumoForm] = useState({
    nombre: "",
    codigo: "",
    unidad: "unidad",
    costo_unitario: 0,
    unidades_por_paquete: 1,
    stock_actual: 0,
    stock_minimo: 0,
  });

  // Formulario Servicio
  const [servicioForm, setServicioForm] = useState({
    nombre: "",
    codigo: "",
    precio: 0,
  });

  // Formulario Receta
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [recetaItems, setRecetaItems] = useState<{insumo_id: string, cantidad_utilizada: number}[]>([]);

  // Búsqueda en Catálogo Maestro (BlueDental)
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogResults, setCatalogResults] = useState<CatalogoInsumo[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);

  // Búsqueda en catálogo dentro de la receta
  const [recipeCatalogSearch, setRecipeCatalogSearch] = useState("");
  const [recipeCatalogResults, setRecipeCatalogResults] = useState<CatalogoInsumo[]>([]);
  const [isSearchingRecipeCatalog, setIsSearchingRecipeCatalog] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [insRes, serRes] = await Promise.all([
        api.get("/api/insumos"),
        api.get("/api/servicios")
      ]);
      setInsumos(insRes.data.items || []);
      setServicios(serRes.data.items || []);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      setErrorMsg("Error al cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers Insumos ---
  const handleInsumoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "codigo") {
      const cleanVal = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      setInsumoForm(prev => ({ ...prev, [name]: cleanVal }));
      return;
    }

    if (name === "nombre") {
      // Forzar primera letra Mayúscula igual que en servicios
      const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
      setInsumoForm(prev => ({ ...prev, [name]: capitalized }));
      return;
    }

    setInsumoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenInsumoModal = (insumo?: Insumo) => {
    setModalMode(insumo ? "edit" : "create");
    setSelectedId(insumo?.id || null);
    setInsumoForm({
      nombre: insumo?.nombre || "",
      codigo: insumo?.codigo || "",
      unidad: insumo?.unidad || "unidad",
      costo_unitario: insumo?.costo_unitario || 0,
      unidades_por_paquete: insumo?.unidades_por_paquete || 1,
      stock_actual: insumo?.stock_actual || 0,
      stock_minimo: insumo?.stock_minimo || 0,
    });
    setIsInsumoModalOpen(true);
  };

  const handleSaveInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await api.post("/api/insumos", insumoForm);
      } else {
        await api.patch(`/api/insumos/${selectedId}`, insumoForm);
      }
      setIsInsumoModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al guardar el insumo");
    }
  };

  const handleDeleteInsumo = async (id: string) => {
    if (!confirm("¿Desactivar este insumo?")) return;
    try {
      await api.delete(`/api/insumos/${id}`);
      fetchData();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  // --- Catálogo Maestro ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (catalogSearch.length < 3) {
        setCatalogResults([]);
        return;
      }
      try {
        setIsSearchingCatalog(true);
        const res = await api.get(`/api/catalogo-insumos?q=${catalogSearch}`);
        setCatalogResults(res.data || []);
      } catch (error) {
        console.error("Error searching catalog:", error);
      } finally {
        setIsSearchingCatalog(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [catalogSearch]);

  const handleCloneFromCatalog = (item: CatalogoInsumo) => {
    setCloningId(item.id);
    
    // DETECCIÓN INTELIGENTE EN FRONTEND (Fallback)
    // Si la DB dice 1 pero el nombre dice 'x 100', usamos el 100 del nombre
    let unidadesDetectadas = item.unidades || 1;
    if (unidadesDetectadas === 1) {
      const match = item.nombre.match(/[xX]\s?(\d+)/);
      if (match) unidadesDetectadas = parseInt(match[1]);
    }

    setInsumoForm({
      nombre: item.nombre,
      codigo: item.sku || "",
      unidad: "unidad", 
      costo_unitario: item.precio_usd,
      unidades_por_paquete: unidadesDetectadas,
      stock_actual: 0,
      stock_minimo: 5,
    });
    // Limpiar búsqueda para mostrar el formulario
    setCatalogSearch("");
    setCatalogResults([]);
    setTimeout(() => setCloningId(null), 1000);
  };

  // --- Catálogo dentro de Receta ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (recipeCatalogSearch.length < 3) {
        setRecipeCatalogResults([]);
        return;
      }
      try {
        setIsSearchingRecipeCatalog(true);
        const res = await api.get(`/api/catalogo-insumos?q=${recipeCatalogSearch}`);
        setRecipeCatalogResults(res.data || []);
      } catch (error) {
        console.error("Error searching recipe catalog:", error);
      } finally {
        setIsSearchingRecipeCatalog(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [recipeCatalogSearch]);

  const handleAddAndCloneToRecipe = async (item: CatalogoInsumo) => {
    try {
      setCloningId(item.id);
      
      // 1. Verificar si el insumo ya existe en el inventario del especialista
      // Buscamos por nombre exacto o por el SKU (código) original
      let insumoExistente = insumos.find(i => 
        i.nombre.toLowerCase() === item.nombre.toLowerCase() || 
        (item.sku && i.codigo === item.sku)
      );

      let insumoId;

      if (insumoExistente) {
        // Si ya existe, simplemente usamos su ID
        insumoId = insumoExistente.id;
      } else {
        // Si no existe, lo clonamos al inventario personal
        const res = await api.post("/api/insumos", {
          nombre: item.nombre,
          codigo: item.sku || "",
          unidad: "unidad",
          costo_unitario: item.precio_usd,
          unidades_por_paquete: item.unidades || 1,
          stock_actual: 0,
          stock_minimo: 5,
        });
        insumoId = res.data.id;
        // Refrescar lista de insumos
        await fetchData();
      }
      
      // 2. Verificar si ya está en la receta actual para no duplicar filas en la UI
      const yaEnReceta = recetaItems.some(ri => ri.insumo_id === insumoId);
      
      if (!yaEnReceta) {
        // 3. Añadirlo a la lista de la receta actual
        setRecetaItems(prev => [...prev, { insumo_id: insumoId, cantidad_utilizada: 1 }]);
      }
      
      // Limpiar búsqueda
      setRecipeCatalogSearch("");
      setRecipeCatalogResults([]);
    } catch (error: any) {
      console.error("Error cloning to recipe:", error);
      const msg = error.response?.data?.detail || "Error al procesar el insumo.";
      alert(msg);
    } finally {
      setCloningId(null);
    }
  };

  // --- Handlers Servicios ---
  const handleServicioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "nombre") {
      // Forzar primera letra Mayúscula
      const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
      setServicioForm(prev => ({ ...prev, [name]: capitalized }));
      return;
    }

    if (name === "codigo") {
      // Forzar Mayúsculas y limpiar caracteres raros
      const cleanVal = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      setServicioForm(prev => ({ ...prev, [name]: cleanVal }));
      return;
    }

    setServicioForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenServicioModal = (servicio?: Servicio) => {
    setModalMode(servicio ? "edit" : "create");
    setSelectedId(servicio?.id || null);
    setServicioForm({
      nombre: servicio?.nombre || "",
      codigo: servicio?.codigo || "",
      precio: servicio?.precio || 0,
    });
    setIsServicioModalOpen(true);
  };

  const handleSaveServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await api.post("/api/servicios", servicioForm);
      } else {
        await api.patch(`/api/servicios/${selectedId}`, servicioForm);
      }
      setIsServicioModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al guardar el servicio");
    }
  };

  // --- Handlers Receta ---
  const handleOpenReceta = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setRecetaItems(servicio.insumos.map(i => ({
      insumo_id: i.insumo_id,
      cantidad_utilizada: i.cantidad_utilizada
    })));
    setIsRecetaModalOpen(true);
  };

  const addRecetaItem = () => {
    setRecetaItems([...recetaItems, { insumo_id: "", cantidad_utilizada: 1 }]);
  };

  const updateRecetaItem = (idx: number, field: string, value: any) => {
    const newItems = [...recetaItems];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setRecetaItems(newItems);
  };

  const removeRecetaItem = (idx: number) => {
    setRecetaItems(recetaItems.filter((_, i) => i !== idx));
  };

  const handleSaveReceta = async () => {
    if (!selectedServicio) return;
    try {
      // Filtrar items vacíos
      const validItems = recetaItems.filter(i => i.insumo_id && i.cantidad_utilizada > 0);
      await api.put(`/api/servicios/${selectedServicio.id}/receta`, { insumos: validItems });
      setIsRecetaModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error al guardar la receta");
    }
  };

  const filteredInsumos = insumos.filter(i => 
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServicios = servicios.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario y Servicios</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Control de insumos, stock y rentabilidad de servicios médicos.
          </p>
        </div>
        
        <div className="flex gap-2 bg-secondary/50 p-1 rounded-2xl border border-border/10">
          <button 
            onClick={() => setActiveTab("insumos")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "insumos" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            Insumos
          </button>
          <button 
            onClick={() => setActiveTab("servicios")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "servicios" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            Servicios
          </button>
        </div>
      </div>

      {/* Grid Resumen Insumos (Solo si estamos en tab insumos) */}
      {activeTab === "insumos" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/30">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Insumos</p>
              <p className="text-2xl font-bold">{insumos.length}</p>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/30">
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Stock Bajo</p>
              <p className="text-2xl font-bold text-orange-500">{insumos.filter(i => i.stock_bajo).length}</p>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-center border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => handleOpenInsumoModal()}>
             <Plus className="text-muted-foreground group-hover:text-primary transition-colors mr-2" />
             <span className="font-semibold text-muted-foreground group-hover:text-primary">Agregar Insumo</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-border/30">
        <div className="relative w-full md:w-96 group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder={`Buscar ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
          />
        </div>
        
        {activeTab === "servicios" && (
          <button 
           onClick={() => handleOpenServicioModal()}
           className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm"
          >
            <Plus size={18} /> Nuevo Servicio
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/30 shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground text-sm">Actualizando inventario...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "insumos" ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/20 text-muted-foreground uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Insumo</th>
                    <th className="px-6 py-4 text-center">Stock / Min</th>
                    <th className="px-6 py-4 text-center">Costo Unit.</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredInsumos.map(insumo => (
                    <tr key={insumo.id} className="table-row-hover bg-card/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${insumo.stock_bajo ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            <FlaskConical size={16} />
                          </div>
                          <div>
                            <p className="font-bold">{insumo.nombre}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{insumo.codigo || 'S/C'} • {insumo.unidad}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${insumo.stock_bajo ? 'text-orange-500' : 'text-foreground'}`}>
                            {insumo.stock_actual}
                          </span>
                          <span className="text-[10px] text-muted-foreground">min: {insumo.stock_minimo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">${insumo.costo_unitario.toLocaleString()}</span>
                          {insumo.unidades_por_paquete > 1 && (
                            <span className="text-[10px] text-primary font-bold">
                              ${(insumo.costo_unitario / insumo.unidades_por_paquete).toFixed(2)} / unidad
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenInsumoModal(insumo)} className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteInsumo(insumo.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/20 text-muted-foreground uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Servicio</th>
                    <th className="px-6 py-4 text-center">Precio</th>
                    <th className="px-6 py-4 text-center">Costo Insumos</th>
                    <th className="px-6 py-4 text-center">Utilidad</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredServicios.map(servicio => (
                    <tr key={servicio.id} className="table-row-hover bg-card/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Stethoscope size={16} />
                          </div>
                          <div>
                            <p className="font-bold">{servicio.nombre}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{servicio.codigo || 'S/C'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        ${servicio.precio.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        ${servicio.costo_insumos.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${servicio.utilidad_neta > 0 ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                           ${servicio.utilidad_neta.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenReceta(servicio)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors" title="Receta de insumos"><Settings2 size={16}/></button>
                          <button onClick={() => handleOpenServicioModal(servicio)} className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"><Edit2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal Insumo */}
      <AnimatePresence>
        {isInsumoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsInsumoModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border/50 bg-secondary/30 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2"><FlaskConical className="text-primary"/> {modalMode === 'create' ? 'Nuevo Insumo' : 'Editar Insumo'}</h2>
                <button onClick={() => setIsInsumoModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                {/* Buscador de Catálogo BlueDental */}
                {modalMode === 'create' && (
                  <div className="space-y-2 pb-4 border-b border-border/30">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Search size={12} /> Buscar en Catálogo BlueDental (Sincronizado)
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Escribe 3 letras (ej: Guantes, Resina...)"
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                      {isSearchingCatalog && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
                    </div>
                    
                    <AnimatePresence>
                      {catalogResults.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-background border border-border shadow-xl rounded-xl mt-2 max-h-48 overflow-y-auto custom-scrollbar divide-y divide-border/50"
                        >
                          {catalogResults.map(item => (
                            <button 
                              key={item.id} 
                              type="button"
                              onClick={() => handleCloneFromCatalog(item)}
                              className="w-full p-3 text-left hover:bg-secondary/50 flex items-center justify-between group transition-colors"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {item.imagen_url && (
                                  <img src={item.imagen_url} alt={item.nombre} className="w-8 h-8 rounded object-cover border border-border/50" />
                                )}
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold truncate">{item.nombre}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">{item.sku || 'S/SKU'} • ${item.precio_usd}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.enlace_origen && (
                                  <a href={item.enlace_origen} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                                <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                                  {cloningId === item.id ? <Check size={14} /> : <Copy size={14} />}
                                </div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {catalogSearch.length >= 3 && catalogResults.length === 0 && !isSearchingCatalog && (
                      <p className="text-[10px] text-muted-foreground italic text-center">No se encontraron productos en el catálogo maestro.</p>
                    )}
                  </div>
                )}

                <form onSubmit={handleSaveInsumo} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Nombre</label>
                      <input required name="nombre" className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm" value={insumoForm.nombre} onChange={handleInsumoInputChange} placeholder="Ej. Guantes de Nitrilo" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Código (Ej: I0001)</label>
                      <input name="codigo" className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm" value={insumoForm.codigo} onChange={handleInsumoInputChange} placeholder="Vacío para auto-generar" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Unidad</label>
                      <input required name="unidad" className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm h-[48px]" value={insumoForm.unidad} onChange={handleInsumoInputChange} placeholder="Caja, ML..." />
                    </div>
                    <NumberInput 
                      label="Costo Unit. (Paquete)" 
                      value={insumoForm.costo_unitario} 
                      onChange={(val) => setInsumoForm({...insumoForm, costo_unitario: val})} 
                      step={0.1} 
                      prefix="$"
                    />
                    <NumberInput 
                      label="Unid. por Paquete" 
                      value={insumoForm.unidades_por_paquete} 
                      onChange={(val) => setInsumoForm({...insumoForm, unidades_por_paquete: val})} 
                      min={1}
                    />
                    <NumberInput 
                      label="Stock Actual (Paquetes)" 
                      value={insumoForm.stock_actual} 
                      onChange={(val) => setInsumoForm({...insumoForm, stock_actual: val})} 
                    />
                    <div className="col-span-2">
                      <NumberInput 
                        label="Stock Mínimo Alerta (Paquetes)" 
                        value={insumoForm.stock_minimo} 
                        onChange={(val) => setInsumoForm({...insumoForm, stock_minimo: val})} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
                    <button type="button" onClick={() => setIsInsumoModalOpen(false)} className="px-4 py-2 text-sm font-semibold hover:bg-secondary rounded-xl transition-colors">Cancelar</button>
                    <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Guardar Insumo</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Servicio */}
      <AnimatePresence>
        {isServicioModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsServicioModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 bg-secondary/30 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><Stethoscope className="text-primary"/> {modalMode === 'create' ? 'Nuevo Servicio' : 'Editar Servicio'}</h2>
                <button onClick={() => setIsServicioModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1"><X size={20}/></button>
              </div>
              <form onSubmit={handleSaveServicio} className="p-6 space-y-6">
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Nombre del Servicio</label>
                      <input required name="nombre" className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm" value={servicioForm.nombre} onChange={handleServicioInputChange} placeholder="Ej. Limpieza Dental" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Código (Ej: S0001)</label>
                        <input name="codigo" className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm h-[48px]" value={servicioForm.codigo} onChange={handleServicioInputChange} placeholder="Vacío para auto-generar" />
                      </div>
                      <NumberInput 
                        label="Precio" 
                        value={servicioForm.precio} 
                        onChange={(val) => setServicioForm({...servicioForm, precio: val})} 
                        step={1} 
                        prefix="$"
                      />
                   </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
                  <button type="button" onClick={() => setIsServicioModalOpen(false)} className="px-4 py-2 text-sm font-semibold hover:bg-secondary rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20">Guardar Servicio</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Receta */}
      <AnimatePresence>
        {isRecetaModalOpen && selectedServicio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsRecetaModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border/50 bg-secondary/30 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">Configurar Receta</h2>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{selectedServicio.nombre}</p>
                </div>
                <button onClick={() => setIsRecetaModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-3">
                   <Info size={20} className="text-primary" />
                   <p className="text-xs text-primary/80 leading-relaxed font-medium">
                     Agrega los insumos que se consumen en este servicio. Esto calculará automáticamente la <strong>rentabilidad</strong> basándose en el precio de venta (${selectedServicio.precio}).
                   </p>
                </div>

                {/* Buscador de Catálogo Directo en Receta */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 pl-1">
                     <FlaskConical size={12} /> Sugerencias de BlueDental para tu receta
                   </label>
                   <div className="relative">
                     <input 
                       type="text" 
                       value={recipeCatalogSearch}
                       onChange={(e) => setRecipeCatalogSearch(e.target.value)}
                       placeholder="Busca y agrega directamente (ej: Resina A2...)"
                       className="w-full bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                     />
                     {isSearchingRecipeCatalog && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
                   </div>
                   
                   <AnimatePresence>
                     {recipeCatalogResults.length > 0 && (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.98 }} 
                         animate={{ opacity: 1, scale: 1 }} 
                         exit={{ opacity: 0, scale: 0.98 }}
                         className="bg-card border border-border shadow-2xl rounded-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar space-y-1"
                       >
                         {recipeCatalogResults.map(item => (
                           <button 
                             key={item.id} 
                             type="button"
                             onClick={() => handleAddAndCloneToRecipe(item)}
                             disabled={cloningId === item.id}
                             className="w-full p-2.5 text-left hover:bg-primary/5 rounded-xl flex items-center justify-between group transition-all"
                           >
                             <div className="flex items-center gap-3 overflow-hidden">
                               {item.imagen_url && (
                                 <img src={item.imagen_url} alt={item.nombre} className="w-10 h-10 rounded-lg object-cover border border-border/30" />
                               )}
                               <div className="overflow-hidden">
                                 <p className="text-[13px] font-bold truncate leading-tight">{item.nombre}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase">{item.sku || 'S/SKU'} • ${item.precio_usd}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-2 shrink-0">
                               <div className={`p-2 rounded-lg transition-all ${cloningId === item.id ? 'bg-success text-success-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                                 {cloningId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                               </div>
                             </div>
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>

                <div className="h-4" /> {/* Spacer */}

                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Insumos de esta Receta</h3>
                   <button onClick={addRecetaItem} className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline">
                     <Plus size={14} /> Fila Manual
                   </button>
                </div>

                {recetaItems.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-2xl">
                    <p className="text-muted-foreground text-sm mb-4">No hay insumos en esta receta.</p>
                    <button onClick={addRecetaItem} className="text-primary font-bold text-sm hover:underline">+ Agregar Insumo</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recetaItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-end bg-secondary/10 p-3 rounded-xl border border-border/10">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Insumo</label>
                          <select 
                            className="w-full bg-background border border-border/50 rounded-lg p-2 text-sm"
                            value={item.insumo_id}
                            onChange={(e) => updateRecetaItem(idx, "insumo_id", e.target.value)}
                          >
                            <option value="">Seleccione...</option>
                            {insumos.map(i => (
                              <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-36">
                          <NumberInput 
                            label="Cantidad" 
                            value={item.cantidad_utilizada} 
                            onChange={(val) => updateRecetaItem(idx, "cantidad_utilizada", val)} 
                            step={0.1}
                          />
                        </div>
                        <button onClick={() => removeRecetaItem(idx)} className="p-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button onClick={addRecetaItem} className="w-full py-3 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground text-sm font-semibold hover:border-primary/50 hover:text-primary transition-all">
                      + Agregar otro insumo
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border/30 flex justify-end gap-3 bg-secondary/10">
                <button onClick={() => setIsRecetaModalOpen(false)} className="px-5 py-2 text-sm font-semibold hover:bg-secondary rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSaveReceta} className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Guardar Receta</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
