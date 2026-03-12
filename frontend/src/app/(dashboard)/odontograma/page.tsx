"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  History, 
  Info,
  Save,
  RotateCcw,
  Loader2,
  Calendar as CalendarIcon,
  AlertCircle,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- Tipos ---

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string | null;
}

interface Hallazgo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'patologia' | 'restauracion' | 'estado';
  descripcion_visual: string | null;
}

interface EstadoCara {
  numero_diente: number;
  cara_diente: string;
  hallazgo_id: string;
  hallazgo_codigo: string;
  hallazgo_nombre: string;
  registro_id: string;
  notas?: string;
}

// --- Componentes UI Locales ---

/**
 * Componente de representación visual de un diente individual (FDI)
 */
const ToothVisual = ({ 
  number, 
  state = {}, 
  selectedHallazgo,
  onApplyHallazgo 
}: { 
  number: number; 
  state: Record<string, EstadoCara>;
  selectedHallazgo: Hallazgo | null;
  onApplyHallazgo: (number: number, side: string) => void;
}) => {
  // Caras: V (Vestibular/Top), L (Lingual/Bottom), M (Mesial/Left or Right), D (Distal/Left or Right), O (Oclusal/Center)
  // La posición de M/D cambia según el cuadrante
  const isRightSide = [1, 4, 5, 8].includes(Math.floor(number / 10));
  
  const getSideColor = (side: string) => {
    const cara = state[side];
    const toothRes = state["R"]; // Hallazgo de pieza completa

    // Si hay un hallazgo de pieza completa que afecta el color (excepto Ausente/X)
    const effectiveCara = (toothRes && toothRes.hallazgo_nombre.toLowerCase().includes('corona')) ? toothRes : cara;

    if (!effectiveCara) return "fill-slate-100 dark:fill-slate-800";
    
    const nombre = effectiveCara.hallazgo_nombre.toLowerCase();
    const codigo = effectiveCara.hallazgo_codigo;

    if (codigo.startsWith('C') || nombre.includes('caries')) {
      return "fill-red-500/80";
    }
    if (codigo === 'COR' || nombre.includes('corona')) {
      return "fill-amber-400/80"; // Dorado para coronas
    }
    if (codigo.startsWith('R') || nombre.includes('resina') || nombre.includes('amalgama') || codigo === 'AMAL') {
      return "fill-sky-500/80";
    }
    return "fill-sky-500/80";
  };

  const getStrokeColor = (side: string) => {
    return "stroke-slate-300 dark:stroke-slate-600";
  };

  const renderSide = (side: string, points: string) => {
    const isActive = !!state[side];
    const isSelected = selectedHallazgo !== null;

    return (
      <path
        d={points}
        className={`${getSideColor(side)} ${getStrokeColor(side)} stroke-[1] transition-all duration-300 ${isSelected ? 'cursor-pointer hover:fill-primary/30' : 'cursor-default'}`}
        onClick={() => isSelected && onApplyHallazgo(number, side)}
      >
        <title>
            Diente {number} - {side === 'R' ? 'Pieza Completa' : side}
            {state[side] ? `\nEstado: ${state[side].hallazgo_nombre}` : '\nEstado: Sano'}
            {state[side]?.notas ? `\nNota: ${state[side].notas}` : ''}
        </title>
      </path>
    );
  };

  const toothRes = state["R"];
  const isAusente = toothRes?.hallazgo_nombre.toLowerCase().includes('ausente') || toothRes?.hallazgo_codigo === 'AUS';
  const isEndo = toothRes?.hallazgo_nombre.toLowerCase().includes('endodoncia') || toothRes?.hallazgo_codigo === 'ENDO' || toothRes?.hallazgo_codigo === 'ENDO_IND';
  const isSano = toothRes?.hallazgo_nombre.toLowerCase().includes('sano') || toothRes?.hallazgo_codigo === 'SANO';
  
  const endoColor = (toothRes?.hallazgo_codigo === 'ENDO_IND' || toothRes?.hallazgo_nombre.toLowerCase().includes('indicada')) ? 'stroke-red-500' : 'stroke-sky-500';

  return (
    <div className="flex flex-col items-center gap-1 group">
      <span className="text-[10px] font-black text-slate-400 group-hover:text-primary transition-colors">{number}</span>
      <div className="relative">
        <svg viewBox="0 0 100 100" className={`w-12 h-12 md:w-14 md:h-14 transition-all duration-300 ${isAusente ? 'opacity-20 translate-y-2' : 'opacity-100'}`}>
            {/* Vestibular (Arriba) */}
            {renderSide("V", "M 0,0 L 100,0 L 80,20 L 20,20 Z")}
            {/* Distal/Mesial (Depende del lado) */}
            {renderSide(isRightSide ? "M" : "D", "M 0,0 L 20,20 L 20,80 L 0,100 Z")}
            {/* Lingual (Abajo) */}
            {renderSide("L", "M 20,80 L 80,80 L 100,100 L 0,100 Z")}
            {/* Mesial/Distal (Depende del lado) */}
            {renderSide(isRightSide ? "D" : "M", "M 80,20 L 100,0 L 100,100 L 80,80 Z")}
            {/* Oclusal (Centro) */}
            {renderSide("O", "M 20,20 L 80,20 L 80,80 L 20,80 Z")}
        </svg>

        {/* Capa de piezas completas (Coronas, Ausentes, Endodoncias, Sanos) */}
        {toothRes && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {isAusente && (
                    <div className="absolute inset-0 flex items-center justify-center rotate-45">
                        <div className="w-[120%] h-1.5 bg-red-500/60 rounded-full" />
                    </div>
                )}
                {toothRes.hallazgo_nombre.toLowerCase().includes('corona') && (
                    <div className="w-full h-full border-4 border-sky-500/40 rounded-xl" />
                )}
                {isEndo && (
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                        <line x1="50" y1="5" x2="50" y2="95" className={`${endoColor} stroke-[8]`} strokeLinecap="round" />
                    </svg>
                )}
                {isSano && (
                    <span className="text-3xl font-black text-sky-600/80 drop-shadow-sm select-none">S</span>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// --- Página Principal ---

export default function OdontogramaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteIdParam = searchParams.get("paciente_id");
  const isEmbed = searchParams.get("embed") === "true";

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(pacienteIdParam);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
  const [selectedHallazgo, setSelectedHallazgo] = useState<Hallazgo | null>(null);
  const [odontogramaState, setOdontogramaState] = useState<Record<number, Record<string, EstadoCara>>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fechaCorte, setFechaCorte] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notas, setNotas] = useState("");

  const quadrants = {
    upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
    upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],
    lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
    lowerRight: [48, 47, 46, 45, 44, 43, 42, 41]
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      // 1. Cargar catálogo de hallazgos
      const resHallazgos = await api.get("/api/odontograma/hallazgos");
      setHallazgos(resHallazgos.data);

      // 2. Cargar pacientes para el selector
      const resPacientes = await api.get("/api/pacientes");
      setPacientes(resPacientes.data.items || []);

      if (selectedPacienteId) {
        // Encontrar paciente seleccionado
        const p = resPacientes.data.items.find((i: Paciente) => i.id === selectedPacienteId);
        if (p) setSelectedPaciente(p);

        // 3. Cargar estado del odontograma (solo si la fecha parece válida YYYY-MM-DD)
        if (fechaCorte && fechaCorte.length === 10) {
          const resEstado = await api.get(`/api/pacientes/${selectedPacienteId}/odontograma?fecha=${fechaCorte}`);
          
          // Mapear array de dientes a objeto de búsqueda rápida Record<number, Record<side, Estado>>
          const stateMap: Record<number, Record<string, EstadoCara>> = {};
          resEstado.data.dientes.forEach((d: EstadoCara) => {
            if (!stateMap[d.numero_diente]) stateMap[d.numero_diente] = {};
            stateMap[d.numero_diente][d.cara_diente] = d;
          });
          setOdontogramaState(stateMap);
        }
      }
    } catch (error) {
      console.error("Error cargando odontograma:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPacienteId, fechaCorte]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyHallazgo = async (numeroDiente: number, caraDiente: string) => {
    if (!selectedHallazgo || !selectedPacienteId) return;

    // Lógica de Pieza Completa: Ciertos hallazgos se aplican al diente completo (cara 'R')
    const nombre = selectedHallazgo.nombre.toLowerCase();
    const codigo = selectedHallazgo.codigo;
    const esPiezaCompleta = 
        nombre.includes('corona') || 
        nombre.includes('ausente') || 
        nombre.includes('endodoncia') || 
        nombre.includes('sano') ||
        codigo === 'COR' || 
        codigo === 'AUS' || 
        codigo === 'ENDO' || 
        codigo === 'SANO' ||
        nombre.includes('protesis');
    
    const caraFinal = esPiezaCompleta ? 'R' : caraDiente;

    try {
      setIsSaving(true);
      const payload = {
        paciente_id: selectedPacienteId,
        numero_diente: numeroDiente,
        cara_diente: caraFinal,
        hallazgo_id: selectedHallazgo.id,
        fecha_registro: fechaCorte,
        notas: notas || null
      };

      await api.post("/api/odontograma/registros", payload);
      
      // Notificación de éxito y limpieza de nota
      await fetchData();
      setNotas("");
    } catch (error) {
      console.error("Error al registrar hallazgo:", error);
      alert("No se pudo registrar el hallazgo.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPacientes = pacientes.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.documento?.includes(searchTerm)
  );

  if (!selectedPacienteId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-primary/10">
            <Stethoscope size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Odontograma Digital</h1>
          <p className="text-muted-foreground text-lg">Selecciona un paciente para visualizar su histórico dental.</p>
        </div>

        <div className="glass-panel p-6 rounded-[2rem] border-none">
             <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input 
              type="text" 
              placeholder="Buscar paciente por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-secondary/30 rounded-2xl border-none focus:ring-2 focus:ring-primary outline-none text-lg transition-all"
            />
          </div>

          {!isLoading && filteredPacientes.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No se encontraron pacientes con ese nombre o documento.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPacientes.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPacienteId(p.id)}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 border border-border/10 hover:border-primary/20 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                  {p.nombre[0]}{p.apellido[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{p.nombre} {p.apellido}</p>
                  <p className="text-xs text-muted-foreground">{p.documento || 'Sin documento'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Render Principal del Odontograma ---

  return (
    <div className="space-y-6">
      {/* Header con nombre: solo visible en modo standalone, no embebido */}
      {!isEmbed && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedPacienteId(null)}
              className="p-3 bg-card hover:bg-secondary rounded-2xl transition-all shadow-sm border border-border/10"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                Odontograma: <span className="text-primary">{selectedPaciente?.nombre} {selectedPaciente?.apellido}</span>
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                    <User size={12} className="text-primary"/> {selectedPaciente?.documento}
                </span>
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest">
                    <CalendarIcon size={12} className="text-primary"/> {(() => {
                        try {
                            const d = new Date(fechaCorte + 'T12:00:00');
                            return isNaN(d.getTime()) ? 'Fecha inválida' : format(d, "dd MMM, yyyy", { locale: es });
                        } catch {
                            return 'Fecha inválida';
                        }
                    })()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border border-border/10 shadow-sm w-full lg:w-auto">
              <input 
                  type="date" 
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="bg-secondary/50 border-none rounded-xl text-xs font-bold p-2.5 outline-none [color-scheme:light]"
              />
              <button className="flex-1 lg:flex-none px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                  <History size={14} /> Historial Dental
              </button>
          </div>
        </div>
      )}

      <div className="space-y-4">

        {/* Paleta de Hallazgos — barra horizontal compacta ENCIMA del odontograma */}
        <div className="glass-panel rounded-2xl border-none p-4">
          <div className="flex flex-wrap items-start gap-6">

            {/* Selector de fecha: solo en modo embed */}
            {isEmbed && (
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="bg-secondary/50 border border-border/30 rounded-xl text-xs font-bold px-3 py-2 outline-none [color-scheme:dark]"
                />
              </div>
            )}

            {/* Grupos de hallazgos en fila */}
            <div className="flex flex-wrap gap-6 flex-1">
              {/* Patologías */}
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-red-400 tracking-widest">Patologías</p>
                <div className="flex flex-wrap gap-1.5">
                  {hallazgos.filter(h => h.categoria === 'patologia').map(h => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHallazgo(selectedHallazgo?.id === h.id ? null : h)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold border ${
                        selectedHallazgo?.id === h.id
                          ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/30 scale-105'
                          : 'bg-secondary/40 text-slate-300 border-transparent hover:border-red-400/40 hover:bg-red-500/10'
                      }`}
                    >
                      {h.nombre}
                      <span className={`text-[9px] font-black px-1 py-0.5 rounded ${
                        selectedHallazgo?.id === h.id ? 'bg-white/20' : 'bg-red-500/20 text-red-400'
                      }`}>{h.codigo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Restauraciones */}
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-sky-400 tracking-widest">Restauraciones</p>
                <div className="flex flex-wrap gap-1.5">
                  {hallazgos.filter(h => h.categoria === 'restauracion').map(h => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHallazgo(selectedHallazgo?.id === h.id ? null : h)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold border ${
                        selectedHallazgo?.id === h.id
                          ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/30 scale-105'
                          : 'bg-secondary/40 text-slate-300 border-transparent hover:border-sky-400/40 hover:bg-sky-500/10'
                      }`}
                    >
                      {h.nombre}
                      <span className={`text-[9px] font-black px-1 py-0.5 rounded ${
                        selectedHallazgo?.id === h.id ? 'bg-white/20' : 'bg-sky-500/20 text-sky-400'
                      }`}>{h.codigo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estados */}
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Estados</p>
                <div className="flex flex-wrap gap-1.5">
                  {hallazgos.filter(h => h.categoria === 'estado').map(h => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHallazgo(selectedHallazgo?.id === h.id ? null : h)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-bold border ${
                        selectedHallazgo?.id === h.id
                          ? 'bg-slate-500 text-white border-slate-500 shadow-md shadow-slate-500/30 scale-105'
                          : 'bg-secondary/40 text-slate-300 border-transparent hover:border-slate-400/40 hover:bg-slate-500/10'
                      }`}
                    >
                      {h.nombre}
                      <span className={`text-[9px] font-black px-1 py-0.5 rounded ${
                        selectedHallazgo?.id === h.id ? 'bg-white/20' : 'bg-slate-500/20 text-slate-400'
                      }`}>{h.codigo}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Nota del hallazgo a la derecha */}
            <div className="shrink-0 w-48">
              <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1.5">Nota de hallazgo</p>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observación adicional..."
                className="w-full bg-background/60 border border-border/30 rounded-xl text-[11px] px-3 py-2 focus:ring-2 focus:ring-primary outline-none resize-none h-16"
              />
            </div>
          </div>

          {/* Banner de modo registro */}
          <AnimatePresence>
            {selectedHallazgo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse shrink-0" />
                  <p className="text-[11px] font-bold text-primary">
                    Modo Registro activo — toca una cara del diente para aplicar{" "}
                    <span className="underline italic">{selectedHallazgo.nombre}</span>.
                    Haz clic de nuevo en el hallazgo para deseleccionar.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Odontograma visual — ocupa todo el ancho */}
        <div className="space-y-4">
            <div className="glass-panel p-4 md:p-8 rounded-2xl border-none overflow-x-auto custom-scrollbar relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Cargando Mapa Dental...</p>
                        </div>
                    </div>
                )}

                <div className="min-w-[800px] flex flex-col items-center gap-10 py-6 px-4">
                    {/* Arcada Superior */}
                    <div className="flex gap-2">
                        <div className="flex gap-1.5 border-r-2 border-slate-200 dark:border-slate-800 pr-4">
                            {quadrants.upperRight.map(n => (
                                <ToothVisual key={n} number={n} state={odontogramaState[n] ?? {}} selectedHallazgo={selectedHallazgo} onApplyHallazgo={handleApplyHallazgo} />
                            ))}
                        </div>
                        <div className="flex gap-1.5 pl-4">
                            {quadrants.upperLeft.map(n => (
                                <ToothVisual key={n} number={n} state={odontogramaState[n] ?? {}} selectedHallazgo={selectedHallazgo} onApplyHallazgo={handleApplyHallazgo} />
                            ))}
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Línea Media
                        </div>
                    </div>

                    {/* Arcada Inferior */}
                    <div className="flex gap-2">
                        <div className="flex gap-1.5 border-r-2 border-slate-200 dark:border-slate-800 pr-4">
                            {quadrants.lowerRight.map(n => (
                                <ToothVisual key={n} number={n} state={odontogramaState[n] ?? {}} selectedHallazgo={selectedHallazgo} onApplyHallazgo={handleApplyHallazgo} />
                            ))}
                        </div>
                        <div className="flex gap-1.5 pl-4">
                            {quadrants.lowerLeft.map(n => (
                                <ToothVisual key={n} number={n} state={odontogramaState[n] ?? {}} selectedHallazgo={selectedHallazgo} onApplyHallazgo={handleApplyHallazgo} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Leyenda */}
                <div className="mt-6 flex flex-wrap justify-center gap-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Patología / Caries</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-sky-500" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Restauración</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border border-slate-400 bg-slate-800" />
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Sano / Sin registro</span>
                    </div>
                </div>
            </div>

            {/* Info evolutivo: solo en modo standalone */}
            {!isEmbed && (
              <div className="p-5 rounded-2xl bg-sky-500/5 border border-sky-500/10 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 shrink-0">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="font-black text-sky-900 dark:text-sky-100 text-sm leading-tight">¿Cómo funciona el Odontograma Evolutivo?</h4>
                    <p className="text-xs text-sky-700/70 dark:text-sky-400/70 mt-1 leading-relaxed">
                        Este sistema funciona por <strong>capas cronológicas</strong>. Cada hallazgo se guarda con la fecha actual.
                        Al cambiar la fecha se reconstruye el estado dental exacto de ese momento.
                        <strong> Regla de Oro 3.1:</strong> Nunca se borra información, solo se añaden capas de evolución clínica.
                    </p>
                </div>
              </div>
            )}
        </div>
      </div>

      <AnimatePresence>
        {isSaving && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-10 right-10 z-[100] flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-2xl shadow-2xl"
            >
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm font-bold tracking-widest uppercase">Guardando Hallazgo...</span>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Icono ausente para el sidebar (Lucide doesn't have a direct counterpart sometimes)
const Stethoscope = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 1 0-.2.3Z"/><path d="M10 2a2 2 0 1 0 4 0"/><path d="m3.4 1.3 8.8 9.6"/><path d="M2 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="m8 10 1.1 1.1"/><path d="M12 21a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4Z"/><path d="M18 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="m14 10-1.1 1.1"/>
    </svg>
);
