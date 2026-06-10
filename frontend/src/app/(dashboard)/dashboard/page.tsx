"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
  UserPlus,
  CheckCircle2,
  Activity,
  Package,
  ArrowUpRight,
  Stethoscope,
  CreditCard,
  ExternalLink,
  Copy,
  Globe
} from "lucide-react";

interface CitaResumen {
  id: string;
  paciente_nombre: string;
  hora: string;
  estado: string;
  duracion_min: number | null;
  notas: string | null;
}

interface PacienteResumen {
  id: string;
  nombre: string;
  documento: string | null;
  created_at: string;
}

interface DashboardStats {
  pacientes_activos: number;
  pacientes_nuevos_mes: number;
  pacientes_tendencia: number;
  citas_hoy: number;
  citas_completadas_hoy: number;
  citas_semana: number;
  citas_tendencia: number;
  insumos_criticos: number;
  ingresos_mes: number;
  costos_mes: number;
  utilidad_mes: number;
  utilidad_tendencia: number;
  saldo_pendiente_total: number;
  historias_totales: number;
  proximas_citas: CitaResumen[];
  ultimos_pacientes: PacienteResumen[];
}

const ESTADO_COLORS: Record<string, string> = {
  programada: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmada: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  en_curso: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completada: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelada: "bg-error-container text-error border-error/30",
};

const ESTADO_LABELS: Record<string, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  en_curso: "En Curso",
  completada: "Completada",
  cancelada: "Cancelada",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function DashboardHome() {
  const { usuario, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rentabilidad, setRentabilidad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [finConfig, setFinConfig] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) return;
      try {
        setLoading(true);
        setError(false);
        const [statsRes, configRes, rentRes] = await Promise.all([
          api.get("/api/dashboard/stats"),
          api.get("/api/dashboard/config"),
          api.get("/api/reportes/rentabilidad-mensual")
        ]);
        setStats(statsRes.data);
        setFinConfig(configRes.data);
        setRentabilidad(rentRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [token]);

  const now = new Date();
  const hora = now.getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  const kpis = [
    {
      label: "Pacientes",
      value: stats?.pacientes_nuevos_mes ?? 0,
      sub: stats?.pacientes_tendencia !== undefined ? (
        <span className={stats.pacientes_tendencia >= 0 ? "text-primary" : "text-error"}>
          {stats.pacientes_tendencia >= 0 ? "+" : ""}{stats.pacientes_tendencia}%
        </span>
      ) : "--",
      icon: Users,
      color: "text-primary",
      borderColor: "border-primary",
      href: "/pacientes",
    },
    {
      label: "Citas Semana",
      value: stats?.citas_semana ?? 0,
      sub: stats?.citas_tendencia !== undefined ? (
        <span className={stats.citas_tendencia >= 0 ? "text-on-surface-variant" : "text-error"}>
          {stats.citas_tendencia >= 0 ? "+" : ""}{stats.citas_tendencia}%
        </span>
      ) : "--",
      icon: Calendar,
      color: "text-secondary",
      borderColor: "border-secondary",
      href: "/citas",
    },
    {
      label: "Utilidad Neta",
      value: formatCurrency(stats?.utilidad_mes ?? 0),
      sub: stats?.utilidad_tendencia !== undefined ? (
        <span className="text-on-surface-variant">
          {finConfig ? `Bs. ${((stats?.utilidad_mes || 0) * finConfig.tasa_eur).toLocaleString('es-VE')}` : '--'}
        </span>
      ) : "--",
      icon: TrendingUp,
      color: "text-primary",
      borderColor: "border-primary",
      href: "/presupuestos",
    },
    {
      label: "Stock Crítico",
      value: stats?.insumos_criticos ?? 0,
      sub: (stats?.insumos_criticos ?? 0) > 0 ? (
        <span className="text-error font-bold">Crítico</span>
      ) : (
        <span className="text-on-surface-variant">Estable</span>
      ),
      icon: AlertTriangle,
      color: (stats?.insumos_criticos ?? 0) > 0 ? "text-error" : "text-on-surface-variant",
      borderColor: (stats?.insumos_criticos ?? 0) > 0 ? "border-error" : "border-outline-variant",
      href: "/inventario",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Activity size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
        </div>
        <p className="text-on-surface-variant font-label-md text-label-md animate-pulse">Cargando métricas clínicas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="p-4 bg-error-container rounded-full border border-error/20 text-error">
          <AlertTriangle size={48} strokeWidth={1.5} />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="font-headline-md text-headline-md text-on-surface">Error de Conexión</h2>
          <p className="text-on-surface-variant font-body-sm text-body-sm">
            Ha ocurrido un problema al cargar el dashboard. Es posible que el servidor esté reiniciando o haya un problema de red.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md rounded-sm hover:opacity-90 transition-all active:scale-95"
        >
          Reintentar ahora
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── HERO SECTION (Stitch UI) ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden glass-panel rounded-xl p-6 md:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8 cyan-glow"
      >
        <div className="z-10 text-center md:text-left space-y-4">
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-label-md text-[10px] uppercase tracking-widest border border-primary/20">
            Panel Principal
          </span>
          <h2 className="font-headline-lg text-3xl md:text-4xl text-on-surface tracking-tight">
            {saludo}, {usuario?.nombre} {usuario?.apellido}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl leading-relaxed">
            Su clínica VitalNexus está operando bajo estándares óptimos. Tiene {stats?.citas_hoy ?? 0} citas programadas para hoy y su balance refleja {formatCurrency(stats?.utilidad_mes ?? 0)} de rentabilidad.
          </p>
          <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
            <Link href="/citas" className="bg-primary text-on-primary px-6 py-2.5 font-label-md text-sm rounded-md shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Ver Agenda Completa
            </Link>
            {usuario?.slug_url && (
              <Link href={`/p/${usuario.slug_url}`} target="_blank" className="border border-outline-variant text-on-surface px-6 py-2.5 font-label-md text-sm rounded-md hover:bg-surface-container-high transition-all flex items-center gap-2">
                <Globe size={16} /> Portal Público
              </Link>
            )}
          </div>
        </div>
        <div className="relative w-40 h-40 md:w-56 md:h-56 flex-shrink-0 hidden sm:block">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-[50px]"></div>
          <div className="w-full h-full border-4 border-primary/20 rounded-full flex items-center justify-center bg-surface-container-highest/50 z-10 relative shadow-[0_0_40px_rgba(76,215,246,0.15)]">
             <Activity size={80} className="text-primary" strokeWidth={1} />
          </div>
        </div>
      </motion.section>

      {/* ── KPI CARDS (Stitch UI) ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4 }}
            className={`glass-panel p-6 rounded-xl border-l-4 ${kpi.borderColor} group cursor-pointer transition-transform duration-300`}
            onClick={() => router.push(kpi.href)}
          >
            <div className="flex justify-between items-start mb-3">
              <kpi.icon size={24} className={kpi.color} strokeWidth={1.5} />
              <span className={`text-xs font-label-md ${kpi.color}`}>{kpi.sub}</span>
            </div>
            <p className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-widest mb-1">
              {kpi.label}
            </p>
            <h3 className="text-on-surface font-headline-md text-2xl lg:text-3xl tracking-tight">
              {kpi.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* ── BENTO GRID: Agenda y Pacientes Recientes ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda de Hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 glass-panel rounded-xl overflow-hidden flex flex-col min-h-[400px]"
        >
          <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
            <h4 className="font-headline-md text-xl text-on-surface flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Agenda de Hoy
            </h4>
            <Link href="/citas" className="text-sm font-label-md text-primary hover:text-primary/80 transition-colors">
              Ver todas
            </Link>
          </div>

          <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {(stats?.proximas_citas ?? []).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-surface-container-highest rounded-full flex items-center justify-center opacity-50 mb-2">
                    <Calendar size={32} className="text-on-surface-variant" />
                  </div>
                  <p className="font-headline-md text-lg text-on-surface-variant opacity-80">No hay citas programadas para hoy</p>
                  <p className="text-on-surface-variant font-body-sm max-w-xs">Utilice el botón superior para agregar un nuevo evento a su agenda médica.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.proximas_citas.map((cita, i) => (
                    <motion.div
                      key={cita.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-highest/30 transition-colors group border border-transparent hover:border-outline-variant/30"
                    >
                      <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface font-headline-md text-sm shrink-0 border border-outline-variant/20 shadow-inner">
                        {cita.hora}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-sm text-on-surface group-hover:text-primary transition-colors truncate">{cita.paciente_nombre}</p>
                        <p className="text-xs text-on-surface-variant font-body-sm truncate mt-1">
                          {cita.notas || "Consulta Clínica"}
                        </p>
                      </div>
                      <span className={`text-[10px] font-label-md px-3 py-1 rounded-full border shrink-0 ${ESTADO_COLORS[cita.estado] || "bg-surface-container text-on-surface border-outline-variant"}`}>
                        {ESTADO_LABELS[cita.estado] ?? cita.estado}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Pacientes Recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="glass-panel rounded-xl overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
            <h4 className="font-headline-md text-lg text-on-surface flex items-center gap-2">
              <Users size={18} className="text-secondary" />
              Recientes
            </h4>
          </div>

          <div className="flex-1 divide-y divide-outline-variant/10 overflow-y-auto custom-scrollbar">
            {(stats?.ultimos_pacientes ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-on-surface-variant/50 gap-3">
                <Users size={32} strokeWidth={1} />
                <p className="text-sm font-label-md">Directorio vacío</p>
              </div>
            ) : (
              stats?.ultimos_pacientes.map((p, i) => (
                <Link
                  href={`/historias?paciente_id=${p.id}`}
                  key={p.id}
                  className="flex items-center gap-4 p-4 hover:bg-surface-container-high/30 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-label-md text-sm">
                    {p.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface font-label-md text-sm group-hover:text-primary transition-colors truncate">
                      {p.nombre}
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-body-sm truncate mt-0.5">
                      {p.documento ? `ID: ${p.documento}` : "Nuevo Ingreso"}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-on-surface-variant/30 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>
          <div className="p-4 text-center border-t border-outline-variant/10 bg-surface-container-lowest/50">
            <Link href="/pacientes" className="text-xs font-label-md text-secondary hover:text-primary transition-colors uppercase tracking-widest">
              Directorio Completo
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── PROFITABILITY TABLE (Rentabilidad) ───────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-panel rounded-xl overflow-hidden mb-8"
      >
        <div className="p-6 border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-headline-md text-xl text-on-surface flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> Rentabilidad por Servicio
            </h4>
            <p className="text-sm text-on-surface-variant mt-1 font-body-sm">Desglose financiero del periodo actual (Ingresos vs Mermas)</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-label-md uppercase">Gastos Fijos</p>
              <p className="text-sm font-bold text-error">-{formatCurrency(rentabilidad?.totales?.gastos_fijos || 0)}</p>
            </div>
            <div className="w-px h-8 bg-outline-variant/30 self-center"></div>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-label-md uppercase">Utilidad Neta</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(rentabilidad?.totales?.utilidad_neta_real || 0)}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-highest/30 border-b border-outline-variant/20">
              <tr>
                <th className="px-6 py-4 text-on-surface font-label-md text-[11px] uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-4 text-on-surface font-label-md text-[11px] uppercase tracking-wider text-center">Volumen</th>
                <th className="px-6 py-4 text-on-surface font-label-md text-[11px] uppercase tracking-wider text-center">Ingreso Bruto</th>
                <th className="px-6 py-4 text-on-surface font-label-md text-[11px] uppercase tracking-wider text-center">Costos Op.</th>
                <th className="px-6 py-4 text-on-surface font-label-md text-[11px] uppercase tracking-wider text-center">Utilidad Real</th>
                <th className="px-6 py-4 text-on-surface font-label-md text-[11px] uppercase tracking-wider text-center">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {rentabilidad?.servicios?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-body-sm italic">
                    Sin operaciones financieras procesadas este mes.
                  </td>
                </tr>
              ) : (
                rentabilidad?.servicios?.map((s: any, i: number) => {
                  const margen = s.ingresos > 0 ? (s.utilidad_neta / s.ingresos) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-label-md text-sm text-on-surface">{s.servicio}</span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant font-body-sm text-center">
                        {s.cantidad}
                      </td>
                      <td className="px-6 py-4 text-on-surface font-label-md text-center">
                        {formatCurrency(s.ingresos)}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant font-body-sm text-center">
                        {formatCurrency(s.costos_insumos + s.costos_merma)}
                      </td>
                      <td className="px-6 py-4 text-primary font-label-md text-center">
                        {formatCurrency(s.utilidad_neta)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${Math.min(Math.max(margen, 0), 100)}%` }} 
                              className={`h-full ${margen > 40 ? 'bg-primary' : 'bg-error'}`} 
                            />
                          </div>
                          <span className={`font-label-md text-xs min-w-[30px] ${margen > 40 ? 'text-primary' : 'text-error'}`}>
                            {Math.round(margen)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.section>

    </div>
  );
}
