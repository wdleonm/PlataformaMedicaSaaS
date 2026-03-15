"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Hallazgo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: "patologia" | "restauracion" | "estado";
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

// ── Diente visual ──────────────────────────────────────────────────────────

const ToothVisual = ({
  number,
  state = {},
  selectedHallazgo,
  onApply,
  small = false,
}: {
  number: number;
  state: Record<string, EstadoCara>;
  selectedHallazgo: Hallazgo | null;
  onApply: (n: number, side: string) => void;
  small?: boolean;
}) => {
  const isRightSide = [1, 4, 5, 8].includes(Math.floor(number / 10));

  const color = (side: string) => {
    const c = state[side];
    const r = state["R"];
    const eff =
      r && r.hallazgo_nombre.toLowerCase().includes("corona") ? r : c;
    if (!eff) return "fill-slate-700";
    const cod = eff.hallazgo_codigo;
    const nom = eff.hallazgo_nombre.toLowerCase();
    if (cod.startsWith("C") || nom.includes("caries")) return "fill-red-500/80";
    if (cod === "COR" || nom.includes("corona")) return "fill-amber-400/80";
    if (cod.startsWith("R") || nom.includes("resina") || nom.includes("amalgama") || cod === "AMAL") return "fill-sky-500/80";
    return "fill-sky-500/80";
  };

  const side = (key: string, d: string) => (
    <path
      key={key}
      d={d}
      className={`${color(key)} stroke-slate-600 stroke-[1] transition-all ${selectedHallazgo ? "cursor-pointer hover:fill-primary/40" : "cursor-default"}`}
      onClick={() => selectedHallazgo && onApply(number, key)}
    />
  );

  const toothRes = state["R"];
  const isAusente = toothRes?.hallazgo_codigo === "AUS" || toothRes?.hallazgo_nombre?.toLowerCase().includes("ausente");
  const isEndo = toothRes?.hallazgo_codigo === "ENDO" || toothRes?.hallazgo_codigo === "ENDO_IND" || toothRes?.hallazgo_nombre?.toLowerCase().includes("endodoncia");
  const isSano = toothRes?.hallazgo_codigo === "SANO";
  const endoColor = toothRes?.hallazgo_codigo === "ENDO_IND" ? "stroke-red-500" : "stroke-sky-500";
  const sz = small ? "w-7 h-7" : "w-9 h-9";

  return (
    <div className="flex flex-col items-center gap-0.5 group">
      <span className="text-[9px] font-black text-slate-500 group-hover:text-primary transition-colors leading-none">
        {number}
      </span>
      <div className="relative">
        <svg viewBox="0 0 100 100" className={`${sz} ${isAusente ? "opacity-20" : ""} transition-all`}>
          {side("V", "M 0,0 L 100,0 L 80,20 L 20,20 Z")}
          {side(isRightSide ? "M" : "D", "M 0,0 L 20,20 L 20,80 L 0,100 Z")}
          {side("L", "M 20,80 L 80,80 L 100,100 L 0,100 Z")}
          {side(isRightSide ? "D" : "M", "M 80,20 L 100,0 L 100,100 L 80,80 Z")}
          {side("O", "M 20,20 L 80,20 L 80,80 L 20,80 Z")}
        </svg>
        {toothRes && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {isAusente && (
              <div className="absolute inset-0 flex items-center justify-center rotate-45">
                <div className="w-[120%] h-1.5 bg-red-500/70 rounded-full" />
              </div>
            )}
            {toothRes.hallazgo_nombre?.toLowerCase().includes("corona") && (
              <div className="w-full h-full border-4 border-sky-500/50 rounded-xl" />
            )}
            {isEndo && (
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                <line x1="50" y1="5" x2="50" y2="95" className={`${endoColor} stroke-[8]`} strokeLinecap="round" />
              </svg>
            )}
            {isSano && (
              <span className="text-2xl font-black text-sky-500/80 select-none">S</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Arcada ─────────────────────────────────────────────────────────────────

const Quadrant = ({
  teeth,
  state,
  selectedHallazgo,
  onApply,
  small,
  border,
}: {
  teeth: number[];
  state: Record<number, Record<string, EstadoCara>>;
  selectedHallazgo: Hallazgo | null;
  onApply: (n: number, side: string) => void;
  small?: boolean;
  border: "right" | "left";
}) => (
  <div className={`flex gap-1 ${border === "right" ? "border-r-2 border-slate-700 pr-3" : "pl-3"}`}>
    {teeth.map((n) => (
      <ToothVisual
        key={n}
        number={n}
        state={state[n] ?? {}}
        selectedHallazgo={selectedHallazgo}
        onApply={onApply}
        small={small}
      />
    ))}
  </div>
);

// ── Componente principal ───────────────────────────────────────────────────

function OdontoEmbed() {
  const searchParams = useSearchParams();
  const pacienteId = searchParams.get("paciente_id");

  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
  const [odontograma, setOdontograma] = useState<Record<number, Record<string, EstadoCara>>>({});
  const [selectedHallazgo, setSelectedHallazgo] = useState<Hallazgo | null>(null);
  const [notas, setNotas] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const headers = () => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const loadOdontograma = useCallback(async () => {
    if (!pacienteId) return;
    try {
      setLoading(true);
      const [rH, rO] = await Promise.all([
        api.get(`/api/odontograma/hallazgos`, { headers: headers() }),
        api.get(`/api/pacientes/${pacienteId}/odontograma?fecha=${fecha}`, { headers: headers() }),
      ]);
      setHallazgos(rH.data);
      const map: Record<number, Record<string, EstadoCara>> = {};
      (rO.data.dientes || []).forEach((d: EstadoCara) => {
        if (!map[d.numero_diente]) map[d.numero_diente] = {};
        map[d.numero_diente][d.cara_diente] = d;
      });
      setOdontograma(map);
    } catch (e) {
      console.error("Error cargando odontograma:", e);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, fecha]);

  useEffect(() => { loadOdontograma(); }, [loadOdontograma]);

  const applyHallazgo = async (numero: number, cara: string) => {
    if (!selectedHallazgo || !pacienteId) return;
    const nom = selectedHallazgo.nombre.toLowerCase();
    const cod = selectedHallazgo.codigo;
    const full = nom.includes("corona") || nom.includes("ausente") || nom.includes("endodoncia") || nom.includes("sano") || nom.includes("protesis") || cod === "COR" || cod === "AUS" || cod === "ENDO" || cod === "ENDO_IND" || cod === "SANO";
    try {
      setSaving(true);
      await api.post(`/api/odontograma/registros`, {
        paciente_id: pacienteId,
        numero_diente: numero,
        cara_diente: full ? "R" : cara,
        hallazgo_id: selectedHallazgo.id,
        fecha_registro: fecha,
        notas: notas || null,
      }, { headers: headers() });
      setNotas("");
      setSavedMsg(`✓ ${selectedHallazgo.nombre} registrado en diente ${numero}`);
      setTimeout(() => setSavedMsg(""), 2500);
      await loadOdontograma();
    } catch (e) {
      console.error("Error registrando:", e);
      alert("No se pudo registrar el hallazgo.");
    } finally {
      setSaving(false);
    }
  };

  // FDI layout completo
  const Q = {
    permanentUpperRight: [18, 17, 16, 15, 14, 13, 12, 11],
    permanentUpperLeft:  [21, 22, 23, 24, 25, 26, 27, 28],
    temporaryUpperRight: [55, 54, 53, 52, 51],
    temporaryUpperLeft:  [61, 62, 63, 64, 65],
    temporaryLowerLeft:  [71, 72, 73, 74, 75],
    temporaryLowerRight: [85, 84, 83, 82, 81],
    permanentLowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
    permanentLowerLeft:  [31, 32, 33, 34, 35, 36, 37, 38],
  };

  const HallazgoBtn = ({ h }: { h: Hallazgo }) => {
    const active = selectedHallazgo?.id === h.id;
    const colors: Record<string, string> = {
      patologia:    active ? "bg-red-500 border-red-500 text-white shadow-red-500/30"    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-red-400/50 hover:bg-red-500/10",
      restauracion: active ? "bg-sky-500 border-sky-500 text-white shadow-sky-500/30"   : "bg-slate-800 border-slate-700 text-slate-300 hover:border-sky-400/50 hover:bg-sky-500/10",
      estado:       active ? "bg-slate-500 border-slate-400 text-white shadow-slate-500/30" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-400/50 hover:bg-slate-500/10",
    };
    const tagColors: Record<string, string> = {
      patologia:    active ? "bg-white/20" : "bg-red-500/20 text-red-400",
      restauracion: active ? "bg-white/20" : "bg-sky-500/20 text-sky-400",
      estado:       active ? "bg-white/20" : "bg-slate-500/20 text-slate-400",
    };
    return (
      <button
        onClick={() => setSelectedHallazgo(active ? null : h)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${active ? "scale-105 shadow-md" : ""} ${colors[h.categoria]}`}
      >
        {h.nombre}
        <span className={`text-[9px] font-black px-1 py-0.5 rounded ${tagColors[h.categoria]}`}>{h.codigo}</span>
      </button>
    );
  };

  const LineMed = () => (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-600 to-transparent relative my-1">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
        Línea Media
      </div>
    </div>
  );

  if (!pacienteId) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
      Sin paciente seleccionado
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 space-y-3">

      {/* ── Barra de Hallazgos ─────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 space-y-2">
        <div className="flex flex-wrap items-start gap-4">

          {/* Fecha */}
          <div className="shrink-0">
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Fecha</p>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-primary [color-scheme:dark]"
            />
          </div>

          {/* Patologías */}
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-red-400 tracking-widest">Patologías</p>
            <div className="flex flex-wrap gap-1.5">
              {hallazgos.filter(h => h.categoria === "patologia").map(h => <HallazgoBtn key={h.id} h={h} />)}
            </div>
          </div>

          {/* Restauraciones */}
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-sky-400 tracking-widest">Restauraciones</p>
            <div className="flex flex-wrap gap-1.5">
              {hallazgos.filter(h => h.categoria === "restauracion").map(h => <HallazgoBtn key={h.id} h={h} />)}
            </div>
          </div>

          {/* Estados */}
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Estados</p>
            <div className="flex flex-wrap gap-1.5">
              {hallazgos.filter(h => h.categoria === "estado").map(h => <HallazgoBtn key={h.id} h={h} />)}
            </div>
          </div>

          {/* Nota */}
          <div className="shrink-0 w-36">
            <p className="text-[9px] font-black uppercase text-sky-400 tracking-widest mb-1">Nota</p>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observación..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg text-[11px] px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary resize-none h-14"
            />
          </div>
        </div>

        {/* Banner modo registro */}
        <AnimatePresence>
          {selectedHallazgo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-primary/15 border border-primary/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shrink-0" />
                <p className="text-[11px] font-bold text-primary">
                  Modo activo — toca una cara del diente para aplicar{" "}
                  <span className="underline italic">{selectedHallazgo.nombre}</span>. Clic de nuevo para deseleccionar.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {savedMsg && (
          <div className="text-[11px] font-bold text-emerald-400 text-center">{savedMsg}</div>
        )}
      </div>

      {/* ── Odontograma FDI ────────────────────────────────────────────── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-2 overflow-x-auto relative">
        {(loading || saving) && (
          <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        )}

        <div className="flex flex-col items-center gap-1.5 min-w-[680px]">

          {/* Fila 1: Permanentes Superiores */}
          <div className="flex gap-1">
            <Quadrant teeth={Q.permanentUpperRight} state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="right" />
            <Quadrant teeth={Q.permanentUpperLeft}  state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="left" />
          </div>

          {/* Fila 2: Temporales Superiores (centrados, más pequeños) */}
          <div className="flex gap-1">
            <Quadrant teeth={Q.temporaryUpperRight} state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="right" small />
            <Quadrant teeth={Q.temporaryUpperLeft}  state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="left" small />
          </div>

          <LineMed />

          {/* Fila 3: Temporales Inferiores (centrados, más pequeños) */}
          <div className="flex gap-1">
            <Quadrant teeth={Q.temporaryLowerRight} state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="right" small />
            <Quadrant teeth={Q.temporaryLowerLeft}  state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="left" small />
          </div>

          {/* Fila 4: Permanentes Inferiores */}
          <div className="flex gap-1">
            <Quadrant teeth={Q.permanentLowerRight} state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="right" />
            <Quadrant teeth={Q.permanentLowerLeft}  state={odontograma} selectedHallazgo={selectedHallazgo} onApply={applyHallazgo} border="left" />
          </div>

        </div>

        {/* Leyenda */}
        <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap justify-center gap-4">
          {[
            { color: "bg-red-500", label: "Patología / Caries" },
            { color: "bg-sky-500", label: "Restauración" },
            { color: "bg-amber-400", label: "Corona" },
            { color: "bg-slate-700 border border-slate-500", label: "Sano / Sin registro" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${l.color}`} />
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EmbedOdontoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 bg-slate-900">
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    }>
      <OdontoEmbed />
    </Suspense>
  );
}
