"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react";

interface SessionWarningModalProps {
  isOpen: boolean;
  secondsLeft: number;
  onContinue: () => void;
  onLogout: () => void;
}

export default function SessionWarningModal({
  isOpen,
  secondsLeft,
  onContinue,
  onLogout,
}: SessionWarningModalProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (secondsLeft / 300) * 100; // 300s = 5 min

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-amber-500/30 relative z-10 overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1 bg-secondary/30 w-full">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="p-8 text-center space-y-6">
              {/* Icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-20 h-20 bg-amber-500/15 border-2 border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto"
              >
                <ShieldAlert size={40} />
              </motion.div>

              {/* Text */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-foreground">
                  Sesión por expirar
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tu sesión se cerrará por inactividad. ¿Deseas continuar
                  trabajando?
                </p>
              </div>

              {/* Countdown */}
              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/20">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Tiempo restante
                </p>
                <p className="text-4xl font-black text-amber-500 tabular-nums">
                  {minutes.toString().padStart(2, "0")}:
                  {seconds.toString().padStart(2, "0")}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onLogout}
                  className="flex-1 py-3.5 font-bold text-sm text-muted-foreground hover:bg-secondary rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
                <button
                  onClick={onContinue}
                  className="flex-1 py-3.5 bg-primary text-primary-foreground font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Continuar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
