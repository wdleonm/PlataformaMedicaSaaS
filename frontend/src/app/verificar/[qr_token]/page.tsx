"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { CheckCircle, AlertTriangle, Loader2, Pill, Activity, Calendar } from "lucide-react";

interface RecipePublico {
  id: string;
  fecha_emision: string;
  medicamentos: string;
  indicaciones: string;
  activo: boolean;
  qr_token: string;
}

export default function VerificarRecipePage() {
  const { qr_token } = useParams();
  const [recipe, setRecipe] = useState<RecipePublico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qr_token) return;

    const verifyRecipe = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/api/recipes/public/${qr_token}`);
        setRecipe(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Récipe no encontrado o el código QR es inválido.");
        } else if (err.response?.status === 400) {
          setError("Este récipe ha sido anulado y ya no es válido.");
        } else {
          setError("Ocurrió un error al verificar el récipe. Inténtalo de nuevo más tarde.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyRecipe();
  }, [qr_token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-8 text-center text-white relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 via-slate-900 to-slate-900"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
              <Pill size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-wide">Plataforma Médica SaaS</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Verificación de Récipe Médico</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
              <p className="font-medium">Verificando autenticidad...</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={40} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Verificación Fallida</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
                Intentar de Nuevo
              </button>
            </div>
          ) : recipe ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h2 className="text-emerald-800 font-bold text-lg">Récipe Válido y Auténtico</h2>
                  <p className="text-emerald-600 text-sm mt-0.5 leading-relaxed">
                    Este documento electrónico ha sido emitido de forma segura a través de nuestra plataforma.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600 text-sm border-b border-slate-100 pb-4">
                  <Calendar size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Fecha de Emisión</p>
                    <p className="font-medium text-slate-800 text-base">{new Date(recipe.fecha_emision).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <Activity size={14} /> Medicamentos Prescritos
                  </h3>
                  <div className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                    {recipe.medicamentos}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-medium tracking-wide">
                  Identificador Único:<br />
                  <span className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded inline-block mt-1">{recipe.qr_token}</span>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
