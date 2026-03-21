"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Wallet, 
  Plus, 
  Search, 
  Loader2, 
  FileText, 
  DollarSign, 
  ChevronRight,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  User,
  Trash2, 
  Edit2,
  Share2,
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Detalle {
  id?: string;
  servicio_id?: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Presupuesto {
  id: string;
  paciente_id: string;
  fecha: string;
  total: number;
  saldo_pendiente: number;
  estado: "borrador" | "aprobado" | "en_pago" | "pagado" | "cancelado";
  detalles: Detalle[];
  notas?: string | null;
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento?: string;
  telefono?: string;
}

export default function FinanzasPage() {
  const { token } = useAuth();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [montoAbono, setMontoAbono] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [finConfig, setFinConfig] = useState({
    moneda_principal: "USD",
    moneda_simbolo: "$",
    tasa_usd: 1.0,
    tasa_eur: 1.0,
    sincronizacion_retrasada: false,
  });

  const [newBudget, setNewBudget] = useState({
    id: "", // Para edición
    paciente_id: "",
    total: 0,
    monto_ajustado: 0,
    notas: "",
    detalles: [] as { servicio_id: string; descripcion: string; cantidad: number; precio_unitario: number }[]
  });
  // Formulario Abono
  const [abonoForm, setAbonoForm] = useState({
    monto: 0,
    metodo_pago: "efectivo",
    notas: "",
  });

  const STATUS_LABELS: Record<string, string> = {
    borrador: "Borrador",
    aprobado: "Aprobado",
    en_pago: "En Pago",
    pagado: "Pagado",
    cancelado: "Cancelado",
  };

  const STATUS_COLORS: Record<string, string> = {
    borrador: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
    aprobado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    en_pago: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    pagado: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelado: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [presRes, pacRes, serRes, configRes] = await Promise.all([
        api.get("/api/presupuestos"),
        api.get("/api/pacientes"),
        api.get("/api/servicios"),
        api.get("/api/dashboard/config")
      ]);
      setPresupuestos(presRes.data.items || []);
      setPacientes(pacRes.data.items || []);
      setServicios(serRes.data.items || []);
      setFinConfig(configRes.data);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const getPacienteNombre = (id: string) => {
    const p = pacientes.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : "Paciente Desconocido";
  };

  const handleOpenDetail = (p: Presupuesto) => {
    setSelectedPresupuesto(p);
    setIsDetailModalOpen(true);
  };

  const handleCreateBudget = async () => {
    const finalTotal = newBudget.monto_ajustado > 0 ? newBudget.monto_ajustado : newBudget.total;
    if (!newBudget.paciente_id || finalTotal <= 0) return;
    setIsSaving(true);
    try {
      let detallesParaEnviar = newBudget.detalles.map(d => ({
        servicio_id: d.servicio_id || null,
        descripcion: d.descripcion,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario
      }));
      
      if (detallesParaEnviar.length === 0) {
        detallesParaEnviar = [{
          servicio_id: null,
          descripcion: "Tratamiento / Plan Integral",
          cantidad: 1,
          precio_unitario: finalTotal
        }];
      } else if (newBudget.monto_ajustado > 0 && newBudget.monto_ajustado !== newBudget.total) {
        const diferencia = newBudget.monto_ajustado - newBudget.total;
        detallesParaEnviar.push({
          servicio_id: null,
          descripcion: diferencia < 0 ? "Descuento / Atención Especial" : "Gasto Adicional / Ajuste",
          cantidad: 1,
          precio_unitario: diferencia
        });
      }

      if (newBudget.id) {
        // Edición
        await api.patch(`/api/presupuestos/${newBudget.id}`, {
          paciente_id: newBudget.paciente_id,
          notas: newBudget.notas,
          detalles: detallesParaEnviar
        });
      } else {
        // Creación
        await api.post("/api/presupuestos", {
          paciente_id: newBudget.paciente_id,
          notas: newBudget.notas,
          detalles: detallesParaEnviar,
          estado: "aprobado"
        });
      }
      
      setIsNewModalOpen(false);
      setNewBudget({ id: "", paciente_id: "", total: 0, monto_ajustado: 0, notas: "", detalles: [] });
      setPatientSearch("");
      fetchData();
    } catch (error) {
      console.error("Error saving budget:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditBudget = (p: Presupuesto) => {
    setNewBudget({
      id: p.id,
      paciente_id: p.paciente_id,
      total: p.total,
      monto_ajustado: 0, // No cargamos ajuste previo directamente como tal, se recalculará
      notas: p.notas || "",
      detalles: p.detalles.map(d => ({
        servicio_id: d.servicio_id || "",
        descripcion: d.descripcion || "",
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario
      }))
    });
    setPatientSearch(getPacienteNombre(p.paciente_id));
    setIsNewModalOpen(true);
  };

  const addServicioToBudget = (s: any) => {
    const nuevosDetalles = [
      ...newBudget.detalles,
      { servicio_id: s.id, descripcion: s.nombre, cantidad: 1, precio_unitario: s.precio }
    ];
    const nuevoTotal = nuevosDetalles.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0);
    setNewBudget({
      ...newBudget,
      detalles: nuevosDetalles,
      total: nuevoTotal
    });
  };

  const removeDetalleFromBudget = (index: number) => {
    const nuevosDetalles = newBudget.detalles.filter((_, i) => i !== index);
    const nuevoTotal = nuevosDetalles.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0);
    setNewBudget({
      ...newBudget,
      detalles: nuevosDetalles,
      total: nuevoTotal
    });
  };

  const updateDetalleCantidad = (index: number, can: number) => {
    const nuevosDetalles = [...newBudget.detalles];
    nuevosDetalles[index].cantidad = can;
    const nuevoTotal = nuevosDetalles.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0);
    setNewBudget({
      ...newBudget,
      detalles: nuevosDetalles,
      total: nuevoTotal
    });
  };

  const [patientSearch, setPatientSearch] = useState("");
  const filteredPatientsForSelect = Array.isArray(pacientes) ? pacientes.filter(p => {
    const search = patientSearch.toLowerCase();
    const doc = (p as any).documento || "";
    const tel = (p as any).telefono || "";
    const searchStr = `${p.nombre} ${p.apellido} ${doc} ${tel}`.toLowerCase();
    return searchStr.includes(search);
  }) : [];

  const handleOpenAbono = (p: Presupuesto) => {
    setSelectedPresupuesto(p);
    setAbonoForm({
      monto: p.saldo_pendiente,
      metodo_pago: "efectivo",
      notas: "",
    });
    setIsAbonoModalOpen(true);
  };

  const handleSaveAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPresupuesto) return;
    try {
      await api.post("/api/abonos", {
        presupuesto_id: selectedPresupuesto.id,
        ...abonoForm
      });
      setIsAbonoModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al registrar pago");
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea anular este presupuesto? Esta acción no se puede deshacer y el saldo pendiente dejará de contar en sus estadísticas.")) return;
    try {
      await api.delete(`/api/presupuestos/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error cancelling budget:", error);
      alert("No se pudo anular el presupuesto");
    }
  };

  const handleShare = (p: Presupuesto, method: 'link' | 'whatsapp') => {
    const url = `${window.location.origin}/presupuesto/${p.id}`;
    if (method === 'link') {
      navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    } else {
      const paciente = pacientes.find(px => px.id === p.paciente_id);
      const phone = (paciente as any)?.telefono?.replace(/\D/g, '') || "";
      const text = encodeURIComponent(`Hola ${paciente?.nombre}, le adjunto el presupuesto de su tratamiento en OdontoFocus: ${url}`);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    }
  };

  const filteredPresupuestos = presupuestos.filter(p => {
    const nombre = getPacienteNombre(p.paciente_id).toLowerCase();
    const searchMatch = nombre.includes(searchTerm.toLowerCase());
    const statusMatch = activeFilter === "todos" || p.estado === activeFilter;
    return searchMatch && statusMatch;
  });

  const totalCartera = presupuestos.reduce((acc, p) => acc + p.saldo_pendiente, 0);

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      borrador: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
      aprobado: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      en_pago: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      pagado: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelado: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[status]}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanzas y Presupuestos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Control de ingresos, presupuestos aprobados y cartera pendiente.
          </p>
        </div>
        
        <div className="flex gap-2 bg-secondary/50 p-1 rounded-2xl border border-border/10">
          {["todos", "en_pago", "aprobado", "pagado", "cancelado"].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                activeFilter === f ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/30 bg-gradient-to-br from-card to-card/50">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Cartera Pendiente</p>
            <p className="text-2xl font-bold">${totalCartera.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-border/30 bg-card/50">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Presupuestos Pagados</p>
            <p className="text-2xl font-bold">{presupuestos.filter(p => p.estado === 'pagado').length}</p>
          </div>
        </div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="flex-1 lg:flex-none"
          >
            <button 
              onClick={() => {
                setNewBudget({ id: "", paciente_id: "", total: 0, monto_ajustado: 0, notas: "", detalles: [] });
                setPatientSearch("");
                setIsNewModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-6 rounded-2xl glass-panel border border-border/20 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="p-2 rounded-lg bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Nuevo Presupuesto</span>
            </button>
          </motion.div>

      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-border/30">
        <div className="relative w-full md:w-96 group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* List Section */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/30 shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground text-sm">Procesando finanzas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/20 text-muted-foreground uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Paciente / Fecha</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Total</th>
                  <th className="px-6 py-4 text-center">Pendiente</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {filteredPresupuestos.map(p => (
                  <tr key={p.id} className="table-row-hover bg-card/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-500/10 text-neutral-500 flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold">{getPacienteNombre(p.paciente_id)}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                            {new Date(p.fecha).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={p.estado} />
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      ${p.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${p.saldo_pendiente > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        ${p.saldo_pendiente.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenAbono(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all ${
                              p.estado === 'cancelado' 
                                ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border/10' 
                                : 'bg-primary text-primary-foreground shadow-primary/20 hover:scale-105'
                            }`}
                            disabled={p.saldo_pendiente === 0 || p.estado === 'cancelado'}
                          >
                            Abonar
                          </button>
                        {p.estado !== 'cancelado' && (
                          <button 
                            onClick={() => handleOpenEditBudget(p)}
                            className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                            title="Editar Presupuesto"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleShare(p, 'link')}
                          className="p-2 hover:bg-violet-500/10 text-violet-500 rounded-lg transition-colors"
                          title="Copiar Enlace Público"
                        >
                          <Share2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenDetail(p)}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                          title="Ver detalles"
                        >
                          <FileText size={16} />
                        </button>
                        {p.estado !== 'cancelado' && (
                          <button 
                            onClick={() => handleDeleteBudget(p.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                            title="Anular Presupuesto"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPresupuestos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-muted-foreground">
                      No se encontraron presupuestos en esta categoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Abono */}
      <AnimatePresence>
        {isAbonoModalOpen && selectedPresupuesto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAbonoModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 bg-secondary/30 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="text-primary"/> Registrar Pago</h2>
                <button onClick={() => setIsAbonoModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1"><X size={20}/></button>
              </div>
              
              <div className="p-4 bg-orange-500/5 border-b border-orange-500/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Saldo Pendiente</span>
                  <span className="text-xl font-bold text-orange-500">${selectedPresupuesto.saldo_pendiente.toLocaleString()}</span>
                </div>
                
                {/* Banner de alerta si la tasa está vieja */}
                {finConfig.sincronizacion_retrasada && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl mb-2">
                    <AlertCircle className="text-red-500" size={14} />
                    <p className="text-[9px] font-bold text-red-500 uppercase leading-none">Tasas BCV desactualizadas. Usando último valor conocido.</p>
                  </div>
                )}

                <div className="flex justify-between items-center bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Referencia Bs. (BCV Euro)</p>
                    <p className="text-lg font-black text-white">
                      {(abonoForm.monto * finConfig.tasa_eur).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right opacity-40">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none mb-1">Informativo USD</p>
                    <p className="text-xs font-bold text-slate-400">
                      {(abonoForm.monto * finConfig.tasa_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveAbono} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Monto del Abono</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      required 
                      type="number"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl font-bold text-lg"
                      value={abonoForm.monto}
                      onChange={(e) => setAbonoForm({...abonoForm, monto: Number(e.target.value)})}
                      max={selectedPresupuesto.saldo_pendiente}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Método de Pago</label>
                  <select 
                    className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm"
                    value={abonoForm.metodo_pago}
                    onChange={(e) => setAbonoForm({...abonoForm, metodo_pago: e.target.value})}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta_debito">Tarjeta Débito</option>
                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Notas / Referencia</label>
                  <textarea 
                    className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm h-20 resize-none"
                    value={abonoForm.notas}
                    onChange={(e) => setAbonoForm({...abonoForm, notas: e.target.value})}
                    placeholder="Opcional..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
                  <button type="button" onClick={() => setIsAbonoModalOpen(false)} className="px-4 py-2 text-sm font-semibold hover:bg-secondary rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Confirmar Pago</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Detalles */}
      <AnimatePresence>
        {isDetailModalOpen && selectedPresupuesto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/10 flex justify-between items-center bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary"><FileText size={20} /></div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Detalles del Presupuesto</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Resumen Financiero</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-background rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Paciente</p>
                    <p className="font-bold">{getPacienteNombre(selectedPresupuesto.paciente_id)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Estado</p>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border inline-block ${STATUS_COLORS[selectedPresupuesto.estado]}`}>
                      {STATUS_LABELS[selectedPresupuesto.estado]}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-background border border-border/20 rounded-2xl">
                    <span className="text-sm font-bold text-muted-foreground">Total del Tratamiento</span>
                    <span className="text-xl font-black text-foreground">${selectedPresupuesto.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                    <span className="text-sm font-bold text-orange-500/80">Saldo Pendiente</span>
                    <span className="text-xl font-black text-orange-500">${selectedPresupuesto.saldo_pendiente.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-secondary/30 border-t border-border/10 flex gap-3">
                <button onClick={() => setIsDetailModalOpen(false)} className="flex-1 py-3 px-4 bg-background border border-border/50 hover:bg-secondary rounded-xl font-bold text-sm transition-all">Cerrar</button>
                <button onClick={() => { setIsDetailModalOpen(false); handleOpenAbono(selectedPresupuesto); }} className="flex-1 py-3 px-4 bg-primary text-primary-foreground hover:scale-105 rounded-xl font-black text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50" disabled={selectedPresupuesto.saldo_pendiente === 0}>Registrar Abono</button>
                <button 
                  onClick={() => handleShare(selectedPresupuesto, 'whatsapp')} 
                  className="p-3 bg-emerald-500 text-white hover:scale-105 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  title="Enviar por WhatsApp"
                >
                  <MessageCircle size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nuevo Presupuesto */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/10 bg-secondary/30 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black tracking-tight">{newBudget.id ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{newBudget.id ? 'Actualiza los términos del plan' : 'Inicia un nuevo plan de tratamiento'}</p>
                </div>
                <button onClick={() => setIsNewModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Buscar Paciente</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      type="text"
                      placeholder="Cédula o Nombre..."
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        if (newBudget.paciente_id) setNewBudget({ ...newBudget, paciente_id: "" });
                      }}
                    />
                  </div>
                  {patientSearch && !newBudget.paciente_id && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-border/30 rounded-xl bg-background shadow-xl z-[100]">
                      {filteredPatientsForSelect.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center italic">
                          No se encontraron pacientes
                        </div>
                      ) : (
                        filteredPatientsForSelect.map(p => (
                          <button 
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setNewBudget({...newBudget, paciente_id: p.id});
                              setPatientSearch(`${p.nombre} ${p.apellido}`);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-primary/5 text-sm flex justify-between items-center group border-b border-border/5 last:border-0"
                          >
                             <span className="font-bold group-hover:text-primary transition-colors">{p.nombre} {p.apellido}</span>
                             <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">{(p as any).documento || 'S/D'}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {newBudget.paciente_id && (
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-primary" />
                        <span className="text-sm font-bold">{patientSearch}</span>
                      </div>
                      <button onClick={() => { setNewBudget({...newBudget, paciente_id: ""}); setPatientSearch(""); }} className="text-xs text-primary font-bold hover:underline">Cambiar</button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Servicios Incluidos</label>
                  </div>
                  
                  {/* Lista de Detalles Actuales */}
                  <div className="space-y-2">
                    {newBudget.detalles.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 bg-secondary/20 p-2 rounded-xl border border-border/10">
                        <div className="flex-1">
                          <p className="text-xs font-bold truncate">{d.descripcion}</p>
                          <p className="text-[10px] text-muted-foreground">${d.precio_unitario.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            className="w-12 bg-background border border-border/50 rounded p-1 text-xs text-center" 
                            value={d.cantidad}
                            onChange={(e) => updateDetalleCantidad(i, Number(e.target.value))}
                          />
                          <button onClick={() => removeDetalleFromBudget(i)} className="text-destructive p-1 hover:bg-destructive/10 rounded"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Buscador de Servicios */}
                  <div className="relative">
                    <select 
                      className="w-full bg-background border border-border/50 rounded-xl p-2 text-xs"
                      onChange={(e) => {
                        const s = servicios.find((sx: any) => sx.id === e.target.value);
                        if (s) addServicioToBudget(s);
                        e.target.value = "";
                      }}
                    >
                      <option value="">+ Agregar un servicio...</option>
                      {servicios?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Monto en Cripto/Divisa</span>
                    <span className="text-lg font-black text-primary">${newBudget.total.toLocaleString()}</span>
                  </div>

                  {/* Conversiones BCV */}
                  {newBudget.total > 0 && (
                    <div className="space-y-2">
                      {finConfig.sincronizacion_retrasada && (
                        <div className="flex items-center gap-2 p-1.5 bg-red-500/5 border border-red-500/10 rounded-lg">
                          <AlertCircle className="text-red-500" size={12} />
                          <p className="text-[8px] font-black text-red-500 uppercase leading-none">Alerta: Tasa BCV no actualizada hoy.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                        <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Cobro en Bs. (BVC Euro)</p>
                          <p className="text-xl font-black text-white">
                            {(newBudget.total * finConfig.tasa_eur).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="opacity-40 flex flex-col justify-center">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">Ref. Informativa (BCV Dólar)</p>
                          <p className="text-sm font-bold text-slate-400">
                            {(newBudget.total * finConfig.tasa_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1.5 pt-2 border-t border-primary/10">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Ajustar Total USD (Opcional)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <input 
                        type="number" 
                        className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-primary/30 rounded-xl text-xl font-black text-primary outline-none focus:border-primary transition-all"
                        placeholder={newBudget.total > 0 ? newBudget.total.toString() : "0.00"}
                        value={newBudget.monto_ajustado === 0 ? '' : newBudget.monto_ajustado}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewBudget({...newBudget, monto_ajustado: val, total: val > 0 ? val : newBudget.total});
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Notas del Presupuesto</label>
                  <input 
                    className="w-full bg-background border border-border/50 rounded-xl p-3 text-sm" 
                    placeholder="Ej. Descuento familiar aplicado..." 
                    value={newBudget.notas} 
                    onChange={(e) => setNewBudget({...newBudget, notas: e.target.value})} 
                  />
                </div>
              </div>
              <div className="p-6 bg-secondary/30 border-t border-border/10 flex gap-3">
                <button onClick={() => setIsNewModalOpen(false)} className="flex-1 py-3 px-4 bg-background border border-border/50 hover:bg-secondary rounded-xl font-bold text-sm transition-all">Cancelar</button>
                <button 
                  onClick={handleCreateBudget} 
                  disabled={isSaving || !newBudget.paciente_id || (newBudget.total <= 0 && newBudget.monto_ajustado <= 0)} 
                  className="flex-1 py-3 px-4 bg-primary text-primary-foreground hover:scale-105 rounded-xl font-black text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                > 
                  {isSaving ? "Guardando..." : newBudget.id ? "Guardar Cambios" : "Emitir Presupuesto"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
