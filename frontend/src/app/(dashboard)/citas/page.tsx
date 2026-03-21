"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  MoreVertical,
  Search,
  Check,
  X,
  DollarSign
} from "lucide-react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  addWeeks, 
  subWeeks, 
  isSameDay, 
  isToday, 
  startOfDay, 
  parseISO,
  eachDayOfInterval,
  endOfWeek,
  setHours,
  setMinutes
} from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string | null;
  telefono: string | null;
}

interface Servicio {
  id: string;
  nombre: string;
  precio: number;
}

interface Cita {
  id: string;
  paciente_id: string;
  servicio_id: string | null;
  fecha_hora: string;
  duracion_min: number;
  estado: "programada" | "confirmada" | "completada" | "cancelada";
  notas: string | null;
  monto_cobrado: number | null;
  costo_insumos: number | null;
  utilidad_neta: number | null;
  presupuesto_id: string | null;
  abono_id: string | null;
}

interface Presupuesto {
  id: string;
  paciente_id: string;
  total: number;
  saldo_pendiente: number;
  estado: string;
  fecha: string;
}

// Horas de la agenda (7:00 AM a 8:00 PM)
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "day">("week");
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finConfig, setFinConfig] = useState({
    moneda_principal: "USD",
    moneda_simbolo: "$",
    tasa_usd: 1.0,
    tasa_eur: 1.0,
  });

  // Form states
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [formData, setFormData] = useState({
    paciente_id: "",
    servicio_id: "",
    fecha: format(new Date(), "yyyy-MM-dd"),
    hora: "09:00",
    duracion_min: 30,
    presupuesto_id: "",
    notas: ""
  });
  const [montoCobrado, setMontoCobrado] = useState(0);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      const start = view === "week" ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfDay(currentDate);
      const end = view === "week" ? endOfWeek(currentDate, { weekStartsOn: 1 }) : addDays(startOfDay(currentDate), 1);
      
      // Fetch each resource independently so a failure in one doesn't block the others
      const [citasRes, pacRes, serRes, presRes, configRes] = await Promise.allSettled([
        api.get(`/api/citas?fecha_desde=${start.toISOString()}&fecha_hasta=${end.toISOString()}`),
        api.get("/api/pacientes"),
        api.get("/api/servicios"),
        api.get("/api/presupuestos"),
        api.get("/api/dashboard/config")
      ]);
      
      if (citasRes.status === "fulfilled") setCitas(citasRes.value.data.items || []);
      if (pacRes.status === "fulfilled") setPacientes(pacRes.value.data.items || []);
      if (serRes.status === "fulfilled") setServicios(serRes.value.data.items || []);
      if (presRes.status === "fulfilled") setPresupuestos(presRes.value.data.items || []);
      if (configRes.status === "fulfilled") setFinConfig(configRes.value.data);

      // Log failures for debugging
      [citasRes, pacRes, serRes, presRes, configRes].forEach((r, i) => {
        if (r.status === "rejected") {
          const names = ["citas", "pacientes", "servicios", "presupuestos", "config"];
          console.error(`Error fetching ${names[i]}:`, r.reason);
        }
      });
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, view]);

  const days = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
      });
    }
    return [currentDate];
  }, [currentDate, view]);

  const [patientSearch, setPatientSearch] = useState("");
  const filteredPatientsForSelect = useMemo(() => {
    const search = patientSearch.toLowerCase();
    return pacientes.filter(p => {
      const doc = p.documento || "";
      const tel = p.telefono || "";
      const searchStr = `${p.nombre} ${p.apellido} ${doc} ${tel}`.toLowerCase();
      return searchStr.includes(search);
    });
  }, [pacientes, patientSearch]);

  const handleOpenCreate = (date?: Date, hour?: number) => {
    setSelectedCita(null);
    setPatientSearch("");
    setFormData({
      paciente_id: "",
      servicio_id: "",
      fecha: format(date || new Date(), "yyyy-MM-dd"),
      hora: hour ? `${hour.toString().padStart(2, "0")}:00` : "09:00",
      duracion_min: 30,
      presupuesto_id: "",
      notas: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cita: Cita) => {
    setSelectedCita(cita);
    const p = pacientes.find(px => px.id === cita.paciente_id);
    setPatientSearch(p ? `${p.nombre} ${p.apellido} - ${p.documento || 'S/D'}` : "");
    const dt = parseISO(cita.fecha_hora);
    setFormData({
      paciente_id: cita.paciente_id,
      servicio_id: cita.servicio_id || "",
      fecha: format(dt, "yyyy-MM-dd"),
      hora: format(dt, "HH:mm"),
      duracion_min: cita.duracion_min,
      presupuesto_id: cita.presupuesto_id || "",
      notas: cita.notas || ""
    });
    setIsModalOpen(true);
  };

  const handleSaveCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const [h, m] = formData.hora.split(":").map(Number);
      const fecha_hora = setMinutes(setHours(parseISO(formData.fecha), h), m).toISOString();
      
      const payload = {
        ...formData,
        fecha_hora,
        servicio_id: formData.servicio_id || null,
        presupuesto_id: formData.presupuesto_id || null
      };

      if (selectedCita) {
        await api.patch(`/api/citas/${selectedCita.id}`, payload);
      } else {
        await api.post("/api/citas", payload);
      }
      setIsModalOpen(false);
      fetchCalendarData();
    } catch (error) {
      console.error("Error saving cita:", error);
      alert("Error al guardar la cita.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (citaId: string, newStatus: string, monto?: number) => {
    try {
      const payload: any = { estado: newStatus };
      if (monto !== undefined) payload.monto_cobrado = monto;
      
      await api.patch(`/api/citas/${citaId}`, payload);
      fetchCalendarData();
      setIsCompleteModalOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "programada": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "confirmada": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "completada": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "cancelada": return "bg-destructive/10 text-destructive border-destructive/30";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda Médica</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestiona tus citas y pacientes para hoy.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/10">
            <button 
              onClick={() => setView("day")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "day" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Día
            </button>
            <button 
              onClick={() => setView("week")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "week" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Semana
            </button>
          </div>
          
          <button 
            onClick={() => handleOpenCreate()}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-border/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentDate(view === "week" ? subWeeks(currentDate, 1) : addDays(currentDate, -1))}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-bold hover:bg-secondary rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button 
              onClick={() => setCurrentDate(view === "week" ? addWeeks(currentDate, 1) : addDays(currentDate, 1))}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold capitalize">
            {format(currentDate, view === "week" ? "MMMM yyyy" : "EEEE, d 'de' MMMM", { locale: es })}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto glass-panel rounded-3xl border border-border/30 shadow-sm relative custom-scrollbar">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        )}

        <div className="min-w-[800px] h-full flex flex-col">
          {/* Calendar Header Groups */}
          <div className="flex border-b border-border/10 sticky top-0 bg-card/80 backdrop-blur-xl z-20">
            <div className="w-20 border-r border-border/10"></div>
            {days.map(day => (
              <div key={day.toString()} className={`flex-1 p-4 text-center border-r border-border/10 last:border-0 ${isToday(day) ? 'bg-primary/5' : ''}`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                  {format(day, "eee", { locale: es })}
                </p>
                <div className={`mt-1 inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-black ${isToday(day) ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : ''}`}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="flex-1 relative">
            {HOURS.map(hour => (
              <div key={hour} className="flex border-b border-border/10 group/row" style={{ minHeight: '80px' }}>
                <div className="w-20 p-2 text-right border-r border-border/10 text-[10px] font-bold text-muted-foreground opacity-50 group-hover/row:opacity-100 transition-opacity">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {days.map(day => {
                  const dayCitas = citas.filter(c => isSameDay(parseISO(c.fecha_hora), day) && parseISO(c.fecha_hora).getHours() === hour);
                  return (
                    <div 
                      key={`${day}-${hour}`} 
                      className="flex-1 border-r border-border/5 p-1 relative hover:bg-secondary/20 transition-colors cursor-pointer group/cell"
                      onClick={() => handleOpenCreate(day, hour)}
                    >
                      <Plus size={16} className="absolute top-2 right-2 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                      
                      {dayCitas.map(cita => {
                        const paciente = pacientes.find(p => p.id === cita.paciente_id);
                        const servicio = servicios.find(s => s.id === cita.servicio_id);
                        return (
                          <motion.div
                            key={cita.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(cita);
                            }}
                            className={`p-2 rounded-xl border text-[10px] shadow-sm mb-1 last:mb-0 cursor-default group/card relative ${getStatusColor(cita.estado)}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-black uppercase tracking-tighter truncate max-w-[80%]">
                                {paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Cargando...'}
                              </span>
                              <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1">
                                {cita.estado !== 'completada' && cita.estado !== 'cancelada' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCita(cita);
                                      setMontoCobrado(servicio?.precio || 0);
                                      setIsCompleteModalOpen(true);
                                    }}
                                    className="p-1 hover:bg-green-500/20 rounded text-green-500"
                                  >
                                    <Check size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 font-bold opacity-80">
                              <Clock size={10} />
                              {format(parseISO(cita.fecha_hora), "HH:mm")} • {cita.duracion_min}m
                            </div>
                            {servicio && (
                              <div className="mt-1 flex items-center gap-1 opacity-60 font-medium italic">
                                <Stethoscope size={10} />
                                <span className="truncate">{servicio.nombre}</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Cita (Create/Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 bg-secondary/30 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CalendarIcon className="text-primary"/> 
                  {selectedCita ? "Editar Cita" : "Nueva Cita"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1.5"><X size={20}/></button>
              </div>

              <form onSubmit={handleSaveCita} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Buscar Paciente (Documento o Nombre)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input 
                        type="text"
                        placeholder="Ej: 123456 o María..."
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value);
                          if (formData.paciente_id) setFormData({...formData, paciente_id: "", presupuesto_id: ""});
                        }}
                      />
                    </div>
                    {patientSearch && !formData.paciente_id && (
                      <div className="mt-2 max-h-40 overflow-y-auto border border-border/30 rounded-xl bg-background shadow-xl z-[120]">
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
                                setFormData({...formData, paciente_id: p.id});
                                setPatientSearch(`${p.nombre} ${p.apellido} - ${p.documento || 'S/D'}`);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-primary/5 text-sm flex justify-between items-center group border-b border-border/5 last:border-0"
                            >
                              <span className="font-bold group-hover:text-primary transition-colors">{p.nombre} {p.apellido}</span>
                              <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground uppercase">{p.documento || 'S/D'}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Servicio / Tratamiento</label>
                    <select 
                      className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={formData.servicio_id}
                      onChange={(e) => setFormData({...formData, servicio_id: e.target.value})}
                    >
                      <option value="">Sin servicio específico</option>
                      {servicios.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} - ${s.precio.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Fecha</label>
                      <input 
                        type="date"
                        required
                        className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none [color-scheme:dark]"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Hora</label>
                      <input 
                        type="time"
                        required
                        className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none [color-scheme:dark]"
                        value={formData.hora}
                        onChange={(e) => setFormData({...formData, hora: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Duración (min)</label>
                      <input 
                        type="number"
                        required
                        min="15"
                        step="15"
                        className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={formData.duracion_min}
                        onChange={(e) => setFormData({...formData, duracion_min: Number(e.target.value)})}
                      />
                    </div>
                    {selectedCita && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Estado</label>
                        <select 
                          className={`w-full border border-border/50 rounded-xl p-2.5 text-sm font-bold outline-none ${getStatusColor(selectedCita.estado)}`}
                          value={selectedCita.estado}
                          onChange={(e) => handleUpdateStatus(selectedCita.id, e.target.value)}
                        >
                          <option value="programada">Programada</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="cancelada">Cancelada</option>
                          <option value="completada">Completada</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Vincular a Presupuesto (Si aplica)</label>
                    <select 
                      className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={formData.presupuesto_id || ""}
                      onChange={(e) => setFormData({...formData, presupuesto_id: e.target.value})}
                      disabled={!formData.paciente_id}
                    >
                      <option value="">Cita Independiente (Consulta)</option>
                      {presupuestos
                        .filter(p => 
                          (p.paciente_id === formData.paciente_id && p.estado !== 'cancelado' && p.estado !== 'pagado') ||
                          p.id === formData.presupuesto_id // Mantener el seleccionado aunque esté pagado
                        )
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            Tratamiento: ${p.total.toLocaleString()} (Pend: ${p.saldo_pendiente.toLocaleString()})
                          </option>
                        ))}
                    </select>
                    {formData.presupuesto_id && (
                      <p className="text-[10px] text-orange-500 font-bold px-1 animate-pulse">
                        ★ Al completar la cita, el pago se imputará automáticamente como un ABONO.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Notas / Observaciones</label>
                    <textarea 
                      className="w-full bg-background border border-border/50 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none resize-none h-24"
                      placeholder="Alguna indicación previa o recordatorio..."
                      value={formData.notas}
                      onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/10">
                  {selectedCita && (
                    <button 
                      type="button"
                      onClick={() => {
                        if(confirm("¿Cancelar esta cita?")) handleUpdateStatus(selectedCita.id, "cancelada");
                      }}
                      className="text-destructive hover:bg-destructive/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                      Cancelar Cita
                    </button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold hover:bg-secondary rounded-xl transition-colors">Cerrar</button>
                    <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2">
                       {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                       {selectedCita ? 'Actualizar' : 'Agendar'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Completar Cita (Monto Cobrado) */}
      <AnimatePresence>
        {isCompleteModalOpen && selectedCita && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setIsCompleteModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-border relative z-10 overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-2xl flex items-center justify-center mx-auto">
                  <DollarSign size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">Completar Cita</h3>
                  <p className="text-muted-foreground text-sm">Ingresa el monto final cobrado al paciente.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-secondary/30 p-4 rounded-2xl space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monto Final USD</p>
                      <input 
                        type="number" 
                        autoFocus
                        className="w-full bg-transparent text-center text-4xl font-black outline-none text-primary"
                        value={montoCobrado}
                        onChange={(e) => setMontoCobrado(Number(e.target.value))}
                      />
                    </div>

                    {/* Conversiones BCV dinámicas */}
                    <div className="grid grid-cols-1 gap-3 pt-3 border-t border-border/10">
                      <div className="bg-indigo-500/10 p-3 rounded-2xl text-center border border-indigo-500/20">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1.5">Monto en Bs. (BCV Euro)</p>
                        <p className="text-xl font-black text-white">
                          {(montoCobrado * finConfig.tasa_eur).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="opacity-40 text-center">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none mb-1">Ref. Informativa USD</p>
                        <p className="text-sm font-bold text-slate-400">
                          {(montoCobrado * finConfig.tasa_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsCompleteModalOpen(false)} className="flex-1 py-4 font-bold hover:bg-secondary rounded-2xl transition-colors">Volver</button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedCita.id, "completada", montoCobrado)}
                      className="flex-1 py-4 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 hover:scale-105 transition-all"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
