"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  Stethoscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string | null;
}

interface HistoriaClinica {
  id: string;
  fecha_apertura: string;
  motivo_consulta: string;
  diagnostico: string | null;
  plan_tratamiento: string | null;
  notas: string | null;
  created_at: string;
}

function HistoriasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pacienteId = searchParams.get("paciente_id");

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [pacientesList, setPacientesList] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedHistoriaId, setSelectedHistoriaId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    motivo_consulta: "",
    diagnostico: "",
    plan_tratamiento: "",
    notas: "",
    fecha_apertura: new Date().toISOString().split('T')[0]
  });

  const fetchPacientes = async () => {
    try {
      setIsLoadingPacientes(true);
      const res = await api.get("/api/pacientes");
      setPacientesList(res.data?.items || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setIsLoadingPacientes(false);
    }
  };

  const fetchData = async () => {
    if (!pacienteId) {
      fetchPacientes();
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      
      // Fetch paciente details
      const pacRes = await api.get(`/api/pacientes/${pacienteId}`);
      setPaciente(pacRes.data);

      // Fetch histories for this patient
      const histRes = await api.get(`/api/pacientes/${pacienteId}/historias`);
      setHistorias(histRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMsg("No se pudieron cargar los datos del paciente o su historial.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pacienteId]);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedHistoriaId(null);
    setFormData({
      motivo_consulta: "",
      diagnostico: "",
      plan_tratamiento: "",
      notas: "",
      fecha_apertura: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (h: HistoriaClinica) => {
    setModalMode("edit");
    setSelectedHistoriaId(h.id);
    setFormData({
      motivo_consulta: h.motivo_consulta,
      diagnostico: h.diagnostico || "",
      plan_tratamiento: h.plan_tratamiento || "",
      notas: h.notas || "",
      fecha_apertura: h.fecha_apertura
    });
    setIsModalOpen(true);
  };

  const handleSaveHistoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    try {
      setIsSaving(true);
      if (modalMode === "create") {
        await api.post("/api/historias-clinicas", {
          ...formData,
          paciente_id: pacienteId
        });
      } else {
        await api.patch(`/api/historias-clinicas/${selectedHistoriaId}`, formData);
      }
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error saving historia:", error);
      alert("Error al guardar la historia clínica.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPacientes = pacientesList.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.documento && p.documento.includes(searchTerm))
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Cargando...</p>
      </div>
    );
  }

  // Vista cuando NO hay un paciente seleccionado
  if (!pacienteId) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-bold tracking-tight">Historias Clínicas</h1>
           <p className="text-muted-foreground">Selecciona un paciente para gestionar su historial médico.</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Buscar paciente por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-background/50 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoadingPacientes ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 size={32} className="mx-auto animate-spin mb-4" />
                Cargando lista de pacientes...
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                  <User size={32} />
                </div>
                <p>No se encontraron pacientes que coincidan.</p>
              </div>
            ) : (
              filteredPacientes.map(p => (
                <button 
                  key={p.id}
                  onClick={() => router.push(`/historias?paciente_id=${p.id}`)}
                  className="flex items-center justify-between p-4 bg-background/40 hover:bg-primary/10 border border-border/30 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                       {p.nombre[0]}{p.apellido[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-muted-foreground">{p.documento || 'Sin ID'}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/pacientes")}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historia Clínica</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <span className="font-semibold text-foreground">{paciente?.nombre} {paciente?.apellido}</span>
              {paciente?.documento && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">ID: {paciente.documento}</span>}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleOpenCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transform transition-all shadow-lg hover:shadow-primary/40 active:scale-95"
        >
          <Plus size={18} />
          Nueva Evolución
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Timeline of Histories */}
      <div className="relative space-y-6">
        {historias.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold">Sin registros clínicos</h3>
            <p className="text-muted-foreground mt-2">Este paciente aún no tiene evoluciones registradas.</p>
            <button 
              onClick={handleOpenCreateModal}
              className="mt-6 text-primary font-semibold hover:underline"
            >
              Crear el primer registro ahora
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {historias.map((h, idx) => (
              <motion.div 
                key={h.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-border/50 group"
              >
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/20">
                  {/* Left Sidebar Info */}
                  <div className="md:w-56 p-6 bg-secondary/20 flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-2">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Stethoscope size={24} />
                    </div>
                    <div className="font-bold text-lg">
                      {format(new Date(h.fecha_apertura), "dd MMM, yyyy", { locale: es })}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> {format(new Date(h.created_at), "HH:mm")}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Motivo de Consulta</h4>
                      <p className="text-foreground font-medium">{h.motivo_consulta}</p>
                    </div>

                    {h.diagnostico && (
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Diagnóstico</h4>
                        <p className="text-sm text-foreground/80 bg-background/30 p-3 rounded-xl border border-border/10 italic">
                          {h.diagnostico}
                        </p>
                      </div>
                    )}

                    {h.plan_tratamiento && (
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Plan de Tratamiento</h4>
                        <p className="text-sm text-foreground/80">
                          {h.plan_tratamiento}
                        </p>
                      </div>
                    )}

                    {h.notas && (
                      <div className="pt-4 border-t border-border/10">
                         <p className="text-xs text-muted-foreground italic">
                           <strong>Notas:</strong> {h.notas}
                         </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex md:flex-col justify-center md:justify-start gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/5">
                    <button 
                      onClick={() => handleOpenEditModal(h)}
                      className="p-3 hover:bg-primary/20 text-primary rounded-xl transition-all shadow-sm hover:scale-110" 
                      title="Editar Evolución"
                    >
                      <Edit2 size={18} />
                    </button>
                    {/* <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={16} />
                    </button> */}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Evolución (Create/Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => !isSaving && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-border/50 bg-secondary/30">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Stethoscope size={20} className="text-primary"/> 
                  {modalMode === "create" ? "Nueva Evolución Clínica" : "Editar Evolución Clínica"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1.5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveHistoria} className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Atención</label>
                    <input 
                      type="date" 
                      value={formData.fecha_apertura} 
                      onChange={(e) => setFormData({...formData, fecha_apertura: e.target.value})} 
                      className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all w-full text-foreground/80 [color-scheme:dark]" 
                    />
                  </div>
                  
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivo de Consulta *</label>
                    <input 
                      required 
                      autoFocus 
                      type="text" 
                      placeholder="Ej. Dolor en molar superior dereche, limpieza general..."
                      value={formData.motivo_consulta} 
                      onChange={(e) => setFormData({...formData, motivo_consulta: e.target.value})} 
                      className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico</label>
                    <textarea 
                      rows={2} 
                      placeholder="Hallazgos clínicos, radiológicos..."
                      value={formData.diagnostico} 
                      onChange={(e) => setFormData({...formData, diagnostico: e.target.value})} 
                      className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all resize-none" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan de Tratamiento</label>
                    <textarea 
                      rows={2} 
                      placeholder="Pasos a seguir, medicamentos, prótesis..."
                      value={formData.plan_tratamiento} 
                      onChange={(e) => setFormData({...formData, plan_tratamiento: e.target.value})} 
                      className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all resize-none" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas Adicionales</label>
                    <textarea 
                      rows={2} 
                      placeholder="Observaciones generales..."
                      value={formData.notas} 
                      onChange={(e) => setFormData({...formData, notas: e.target.value})} 
                      className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all resize-none" 
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    disabled={isSaving}
                    className="px-5 py-2.5 text-sm font-medium hover:bg-secondary rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-75 disabled:active:scale-100"
                  >
                    {isSaving ? <><Loader2 size={16} className="animate-spin"/> Guardando</> : 'Guardar Cambios'}
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

export default function HistoriasPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    }>
      <HistoriasContent />
    </Suspense>
  );
}
