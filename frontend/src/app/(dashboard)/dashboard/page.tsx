"use client";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  citas_hoy: number;
  citas_completadas_hoy: number;
  citas_semana: number;
  insumos_criticos: number;
  ingresos_mes: number;
  costos_mes: number;
  utilidad_mes: number;
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
  cancelada: "bg-red-500/20 text-red-400 border-red-500/30",
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!token) return;
      try {
        const { data } = await api.get("/api/dashboard/stats");
        setStats(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [token]);

  const now = new Date();
  const hora = now.getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  const kpis = [
    {
      label: "Pacientes Activos",
      value: stats?.pacientes_activos ?? 0,
      sub: `+${stats?.pacientes_nuevos_mes ?? 0} este mes`,
      icon: Users,
      color: "text-sky-400",
      bg: "bg-sky-400/10",
      border: "border-sky-400/20",
      href: "/pacientes",
    },
    {
      label: "Citas Hoy",
      value: stats?.citas_hoy ?? 0,
      sub: `${stats?.citas_completadas_hoy ?? 0} completadas`,
      icon: Calendar,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      border: "border-violet-400/20",
      href: "/citas",
    },
    {
      label: "Utilidad Neta (Mes)",
      value: formatCurrency(stats?.utilidad_mes ?? 0),
      sub: `Costo insumos: ${formatCurrency(stats?.costos_mes ?? 0)}`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      href: "/presupuestos",
      isText: true,
    },
    {
      label: "Cartera Pendiente",
      value: formatCurrency(stats?.saldo_pendiente_total ?? 0),
      sub: "Total deudores",
      icon: CreditCard,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      href: "/presupuestos",
      isText: true,
    },
    {
      label: "Insumos Críticos",
      value: stats?.insumos_criticos ?? 0,
      sub: stats?.insumos_criticos
        ? "⚠ Requiere reposición"
        : "✓ Stock al día",
      icon: Package,
      color:
        (stats?.insumos_criticos ?? 0) > 0
          ? "text-amber-400"
          : "text-emerald-400",
      bg:
        (stats?.insumos_criticos ?? 0) > 0
          ? "bg-amber-400/10"
          : "bg-emerald-400/10",
      border:
        (stats?.insumos_criticos ?? 0) > 0
          ? "border-amber-400/20"
          : "border-emerald-400/20",
      href: "/inventario",
    },
  ];

  const accesosRapidos = [
    { label: "Nueva Cita", href: "/citas", icon: Calendar, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "Nuevo Paciente", href: "/pacientes", icon: UserPlus, color: "text-sky-400", bg: "bg-sky-400/10" },
    { label: "Historias Clínicas", href: "/historias", icon: FileText, color: "text-teal-400", bg: "bg-teal-400/10" },
    { label: "Odontograma", href: "/odontograma", icon: Stethoscope, color: "text-rose-400", bg: "bg-rose-400/10" },
    { label: "Presupuestos", href: "/presupuestos", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Inventario", href: "/inventario", icon: Package, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Activity size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Cargando tu clínica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-1">
            {saludo},
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Dr. {usuario?.nombre} {usuario?.apellido}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {usuario?.slug_url && (
            <div className="flex items-center gap-3 mt-4">
              <Link 
                href={`/p/${usuario.slug_url}`} 
                target="_blank"
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl text-violet-400 text-xs font-bold transition-all group"
              >
                <Globe size={14} />
                Portal Público
                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/p/${usuario.slug_url}`;
                  navigator.clipboard.writeText(url);
                  alert("Enlace copiado al portapapeles");
                }}
                className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                title="Copiar enlace"
              >
                <Copy size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-2xl border border-border/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground">Sistema Activo</span>
        </div>
      </motion.header>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, scale: 1.01 }}
          >
            <Link
              href={kpi.href}
              className={`block p-6 rounded-2xl glass-panel border ${kpi.border} hover:shadow-lg transition-all group relative overflow-hidden`}
            >
              {/* Glow sutil */}
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${kpi.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />

              <div className="flex justify-between items-start mb-4 relative">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <kpi.icon size={20} className={kpi.color} />
                </div>
                <ArrowUpRight size={16} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>

              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                {kpi.label}
              </p>
              <p className={`text-3xl font-black ${kpi.color} leading-none`}>
                {kpi.value}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {kpi.sub}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── Fila central: Próximas Citas + Últimos Pacientes ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Próximas Citas de Hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel rounded-3xl border border-border/20 overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-400/10 rounded-xl">
                <Clock size={18} className="text-violet-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Agenda de Hoy</h2>
                <p className="text-xs text-muted-foreground">
                  {stats?.citas_hoy ?? 0} cita{(stats?.citas_hoy ?? 0) !== 1 ? "s" : ""} programada{(stats?.citas_hoy ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Link
              href="/citas"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
            >
              Ver agenda <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="p-4 space-y-2 min-h-[220px]">
            <AnimatePresence>
              {(stats?.proximas_citas ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50 gap-3">
                  <Calendar size={36} strokeWidth={1} />
                  <p className="text-sm font-medium">Sin citas para hoy</p>
                  <Link
                    href="/citas"
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Agendar una cita
                  </Link>
                </div>
              ) : (
                stats?.proximas_citas.map((cita, i) => (
                  <motion.div
                    key={cita.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-400/10 flex items-center justify-center text-violet-400 font-black text-sm shrink-0">
                      {cita.hora}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{cita.paciente_nombre}</p>
                      {cita.notas && (
                        <p className="text-xs text-muted-foreground truncate">{cita.notas}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 ${ESTADO_COLORS[cita.estado] || "bg-secondary text-muted-foreground"}`}>
                      {ESTADO_LABELS[cita.estado] ?? cita.estado}
                    </span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Últimos Pacientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="glass-panel rounded-3xl border border-border/20 overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-400/10 rounded-xl">
                <Users size={18} className="text-sky-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Pacientes Recientes</h2>
                <p className="text-xs text-muted-foreground">
                  {stats?.pacientes_activos ?? 0} en total
                </p>
              </div>
            </div>
            <Link
              href="/pacientes"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
            >
              Ver todos <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="p-4 space-y-2 min-h-[220px]">
            {(stats?.ultimos_pacientes ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50 gap-3">
                <Users size={36} strokeWidth={1} />
                <p className="text-sm font-medium">Sin pacientes registrados</p>
                <Link
                  href="/pacientes"
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Registrar paciente
                </Link>
              </div>
            ) : (
              stats?.ultimos_pacientes.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/historias?paciente_id=${p.id}`}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/30 to-blue-600/30 flex items-center justify-center font-black text-sky-400 text-sm shrink-0">
                      {p.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                        {p.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.documento ? `ID: ${p.documento}` : "Sin documento"} · {p.created_at}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Accesos Rápidos ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Activity size={18} className="text-primary" />
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {accesosRapidos.map((item, i) => (
            <motion.div
              key={item.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl glass-panel border border-border/20 hover:border-border/40 transition-all group`}
              >
                <div className={`p-3 rounded-xl ${item.bg} group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} className={item.color} />
                </div>
                <span className="text-xs font-bold text-center text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Stats extra: Semana + Historias ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            label: "Citas esta semana",
            value: stats?.citas_semana ?? 0,
            icon: TrendingUp,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10",
            href: "/citas",
          },
          {
            label: "Historias Clínicas",
            value: stats?.historias_totales ?? 0,
            icon: FileText,
            color: "text-teal-400",
            bg: "bg-teal-400/10",
            href: "/historias",
          },
          {
            label: "Por Cobrar",
            value: formatCurrency(stats?.saldo_pendiente_total ?? 0),
            icon: CreditCard,
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            isText: true,
            href: "/presupuestos",
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -3 }}
          >
            <Link
              href={item.href}
              className="p-5 glass-panel rounded-2xl border border-border/20 flex items-center gap-4 hover:border-primary/40 transition-all group"
            >
              <div className={`p-3 rounded-xl ${item.bg} shrink-0 group-hover:scale-110 transition-transform`}>
                <item.icon size={20} className={item.color} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{item.label}</p>
                <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
