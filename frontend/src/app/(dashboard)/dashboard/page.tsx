"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export default function DashboardHome() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center justify-between pb-4 border-b border-border/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido, Dr. {usuario?.apellido}</h1>
          <p className="text-muted-foreground mt-1">Aquí está el resumen de tu clínica hoy.</p>
        </div>
      </header>

      {/* Grid de Resumen simulado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl glass-panel shadow-sm border border-border/20"
        >
          <h3 className="text-sm font-medium text-muted-foreground">Pacientes Activos</h3>
          <p className="text-4xl font-black mt-2 text-foreground">1,245</p>
          <div className="mt-4 text-xs font-semibold text-success bg-success/10 inline-block px-2 py-1 rounded-md">
            +12% este mes
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl glass-panel shadow-sm border border-border/20 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <h3 className="text-sm font-medium text-muted-foreground">Citas de Hoy</h3>
          <p className="text-4xl font-black mt-2 text-primary">8</p>
          <div className="mt-4 text-xs text-muted-foreground">
            Próxima cita en 15 minutos
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl glass-panel shadow-sm border border-warning/20"
        >
          <h3 className="text-sm font-medium text-muted-foreground">Insumos Críticos</h3>
          <p className="text-4xl font-black mt-2 text-warning">3</p>
          <div className="mt-4 text-xs font-semibold text-warning bg-warning/10 inline-block px-2 py-1 rounded-md">
            Requiere pedido urgente
          </div>
        </motion.div>
      </div>

      {/* Próximos Pasos (Fase 5 y 6) */}
      <div className="p-8 rounded-3xl bg-secondary/30 border border-border/20 mt-10 glass-panel">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          Tecnología con Propósito Clínico 🩺
        </h2>
        <p className="text-muted-foreground text-sm max-w-4xl leading-relaxed">
          Odonto-Focus no solo organiza tus datos; potencia tu capacidad de cuidar. Bienvenido a tu centro de mando profesional, diseñado para que tu única preocupación sea la excelencia en cada tratamiento, donde cada <strong>registro es una historia y cada cita es un paso hacia una mejor salud</strong>. Gestiona tu agenda y tus historias clínicas con la tranquilidad de que la información está donde debe estar: al servicio de tus pacientes.
        </p>
      </div>
    </div>
  );
}
