"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, FileText, Printer, Loader2, Edit2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

// @ts-ignore
import { QRCodeSVG } from "qrcode.react";

export interface Recipe {
  id: string;
  especialista_id: string;
  paciente_id: string;
  historia_clinica_id?: string | null;
  fecha_emision: string;
  medicamentos: string;
  indicaciones: string;
  notas_adicionales: string;
  qr_token: string;
}

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: any;
  historiaClinicaId?: string | null;
  isTab?: boolean;
}

export default function RecipeModal({ isOpen, onClose, paciente, historiaClinicaId, isTab = false }: RecipeModalProps) {
  const { usuario } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recipeToPrint, setRecipeToPrint] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    medicamentos: "",
    indicaciones: "",
    notas_adicionales: ""
  });
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && paciente) {
      fetchRecipes();
    }
  }, [isOpen, paciente]);

  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/recipes/paciente/${paciente.id}`);
      let fetchedRecipes = res.data;
      if (historiaClinicaId) {
        fetchedRecipes = fetchedRecipes.filter((r: Recipe) => r.historia_clinica_id === historiaClinicaId);
      }
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.error("No se pudieron cargar los récipes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.medicamentos || !formData.indicaciones) {
      toast.error("Por favor llena los medicamentos e indicaciones.");
      return;
    }
    try {
      setIsSaving(true);
      let res;
      if (editingRecipeId) {
        res = await api.patch(`/api/recipes/${editingRecipeId}`, {
          medicamentos: formData.medicamentos,
          indicaciones: formData.indicaciones,
          notas_adicionales: formData.notas_adicionales
        });
        toast.success("Récipe actualizado con éxito");
      } else {
        res = await api.post("/api/recipes", {
          paciente_id: paciente.id,
          historia_clinica_id: historiaClinicaId || null,
          medicamentos: formData.medicamentos,
          indicaciones: formData.indicaciones,
          notas_adicionales: formData.notas_adicionales
        });
        toast.success("Récipe creado con éxito");
      }
      setIsCreating(false);
      setEditingRecipeId(null);
      setFormData({ medicamentos: "", indicaciones: "", notas_adicionales: "" });
      fetchRecipes();
      setRecipeToPrint(res.data);
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Error al guardar el récipe.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (!recipeToPrint || !paciente) return;

    const nombrePaciente = `${paciente.nombre || ""} ${paciente.apellido || ""}`.trim();
    const cedula = paciente.cedula || paciente.documento || "";
    const fecha = new Date(recipeToPrint.fecha_emision).toLocaleDateString("es-VE").replace(/\//g, "-");
    const titulo = `Recipe_${nombrePaciente}${cedula ? `_${cedula}` : ""}_${fecha}`;

    // Obtener el SVG del código QR renderizado de forma oculta
    const qrSvgElement = document.querySelector('#recipe-print-qr-source svg');
    const qrSvgHtml = qrSvgElement ? qrSvgElement.outerHTML : '';

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const credentialsHtml = (codigoColegio || codigoMpps || codigoRegional) ? `
      <div class="medico-creds">
        ${codigoColegio ? `<span>CMP: <strong>${codigoColegio}</strong></span>` : ''}
        ${codigoMpps ? `<span>MPPS: <strong>${codigoMpps}</strong></span>` : ''}
        ${codigoRegional ? `<span>Cod. Regional: <strong>${codigoRegional}</strong></span>` : ''}
      </div>
    ` : '';

    const clinicaHtml = clinicaNombre ? `
      <div class="clinica">
        ${clinicaNombre}${clinicaDireccion ? ` — ${clinicaDireccion}` : ""}
      </div>
    ` : '';

    const notasHtml = recipeToPrint.notas_adicionales ? `
      <div class="notas">${recipeToPrint.notas_adicionales}</div>
    ` : '';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titulo}</title>
        <style>
          @page { size: 8.5in 5.5in landscape; margin: 0; }
          body {
            margin: 0; padding: 0.3in 0.4in; width: 8.5in; height: 5.5in;
            box-sizing: border-box; font-family: Georgia, 'Times New Roman', serif;
            color: #111; display: flex; flex-direction: column; overflow: hidden;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .header { border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 8px; text-align: center; }
          .medico-nombre { font-size: 14pt; font-weight: bold; color: #000; line-height: 1.2; }
          .medico-esp { font-size: 9pt; color: #333; margin-top: 2px; }
          .medico-creds { font-size: 8pt; color: #444; margin-top: 3px; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
          .clinica { font-size: 8pt; color: #444; margin-top: 2px; }
          .paciente-info { display: flex; justify-content: space-between; font-size: 9pt; color: #222; border-bottom: 1px solid #888; padding-bottom: 5px; margin-bottom: 8px; }
          .paciente-nombre { font-weight: bold; }
          .cols { display: flex; flex: 1; overflow: hidden; gap: 0; }
          .col-left { flex: 1; padding-right: 20px; border-right: 2px solid #555; display: flex; flex-direction: column; overflow: hidden; }
          .col-right { flex: 1; padding-left: 20px; display: flex; flex-direction: column; overflow: hidden; }
          .col-title { font-size: 18pt; font-weight: 900; color: #000; margin-bottom: 6px; font-family: Georgia, serif; }
          .col-content { font-size: 9pt; color: #111; white-space: pre-wrap; line-height: 1.5; flex: 1; overflow: hidden; }
          .footer-left { margin-top: 8px; padding-top: 6px; border-top: 1px solid #aaa; display: flex; justify-content: space-between; align-items: flex-end; }
          .qr-container { display: flex; flex-direction: column; align-items: center; gap: 2px; }
          .qr-label { font-size: 7pt; color: #666; }
          .firma-container { text-align: center; font-family: Georgia, serif; }
          .firma-line { width: 130px; border-top: 1.5px solid #333; margin-bottom: 3px; }
          .firma-label { font-size: 8pt; color: #333; font-weight: bold; }
          .notas { margin-top: 6px; padding-top: 4px; border-top: 1px solid #ddd; font-size: 8pt; color: #555; font-style: italic; }
          .footer-right { margin-top: 6px; text-align: right; font-size: 7pt; color: #aaa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="medico-nombre">${nombreMedico}</div>
          <div class="medico-esp">${especialidadMedico}</div>
          ${credentialsHtml}
          ${clinicaHtml}
        </div>
        <div class="paciente-info">
          <span class="paciente-nombre">
            Paciente: ${paciente?.nombre} ${paciente?.apellido}
            ${paciente?.cedula ? ` · C.I. ${paciente.cedula}` : ""}
          </span>
          <span>${new Date(recipeToPrint.fecha_emision).toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" })}</span>
        </div>
        <div class="cols">
          <div class="col-left">
            <div class="col-title">Rp.</div>
            <div class="col-content">${recipeToPrint.medicamentos}</div>
            <div class="footer-left">
              <div class="qr-container">
                ${qrSvgHtml}
                <span class="qr-label">Escanear para verificar</span>
              </div>
              <div class="firma-container">
                <div class="firma-line"></div>
                <span class="firma-label">Firma y Sello</span>
              </div>
            </div>
          </div>
          <div class="col-right">
            <div class="col-title">Indicaciones</div>
            <div class="col-content">${recipeToPrint.indicaciones}</div>
            ${notasHtml}
            <div class="footer-right">VitalNexus · Plataforma Médica SaaS</div>
          </div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Guardar el título original
    const prevTitle = document.title;

    setTimeout(() => {
      // Cambiar el título del padre para que el PDF se guarde con el nombre correcto
      document.title = titulo;
      
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Restaurar el título original después de imprimir
      document.title = prevTitle;
      
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };

  // ─── Datos del médico ─────────────────────────────────────────────────────
  const nombreMedico = usuario ? `Dr(a). ${usuario.nombre} ${usuario.apellido}` : "Dr(a). Médico Tratante";
  const especialidadMedico = usuario?.especialidades?.length
    ? usuario.especialidades.map((e: any) => e.nombre).join(" | ")
    : "Medicina General";
  const codigoColegio = usuario?.codigo_colegio_medico || null;
  const codigoMpps = usuario?.codigo_mpps || null;
  const codigoRegional = usuario?.codigo_regional || null;
  const clinicaNombre = usuario?.clinica_nombre || null;
  const clinicaDireccion = usuario?.clinica_direccion || null;

  if (!isOpen) return null;

  // ─── Vista previa en pantalla ─────────────────────────────────────────────
  const PreviewCard = ({ recipe }: { recipe: Recipe }) => (
    <div className="flex-1 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Encabezado médico */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 text-center">
        <p className="text-base font-bold text-slate-900">{nombreMedico}</p>
        <p className="text-xs text-slate-600 mt-0.5">{especialidadMedico}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-1.5 text-[11px] text-slate-500">
          {codigoColegio && <span>CMP: <strong className="text-slate-700">{codigoColegio}</strong></span>}
          {codigoMpps && <span>MPPS: <strong className="text-slate-700">{codigoMpps}</strong></span>}
          {codigoRegional && <span>Reg: <strong className="text-slate-700">{codigoRegional}</strong></span>}
        </div>
        {clinicaNombre && <p className="text-[11px] text-slate-500 mt-1">{clinicaNombre}{clinicaDireccion ? ` · ${clinicaDireccion}` : ""}</p>}
      </div>

      {/* Paciente + fecha */}
      <div className="px-6 py-2 border-b border-slate-100 flex justify-between items-center text-xs">
        <span className="text-slate-700 font-semibold">
          Paciente: {paciente?.nombre} {paciente?.apellido}
          {paciente?.cedula ? ` · C.I. ${paciente.cedula}` : ""}
        </span>
        <span className="text-slate-500">
          {new Date(recipe.fecha_emision).toLocaleDateString("es-VE", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      </div>

      {/* Cuerpo: dos columnas */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 flex-1 p-0" style={{ minHeight: "200px" }}>
        <div className="p-5 flex flex-col">
          <p className="text-lg font-black text-slate-900 mb-3 font-serif">Rp.</p>
          <p className="flex-1 text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">{recipe.medicamentos}</p>
          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end">
            <div className="flex flex-col items-center gap-0.5">
              <QRCodeSVG value={`${window.location.origin}/verificar/${recipe.qr_token}`} size={56} />
              <span className="text-[9px] text-slate-400">Verificar</span>
            </div>
            <div className="text-center text-xs text-slate-500 font-serif">
              <div className="w-28 border-t border-slate-400 mb-1" />
              Firma y Sello
            </div>
          </div>
        </div>
        <div className="p-5 flex flex-col">
          <p className="text-lg font-black text-slate-900 mb-3 font-serif">Indicaciones</p>
          <p className="flex-1 text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">{recipe.indicaciones}</p>
          {recipe.notas_adicionales && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic">{recipe.notas_adicionales}</div>
          )}
        </div>
      </div>
    </div>
  );



  // ─── Contenido principal del modal / pestaña ─────────────────────────────
  const content = (
    <div className={`w-full ${isTab ? "h-[580px]" : "max-w-5xl h-[85vh]"} rounded-[2.5rem] ${isTab ? "" : "glass-panel shadow-2xl"} border-none relative z-10 overflow-hidden flex flex-col print:hidden bg-surface-container-lowest`}>
      {!isTab && (
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/50 bg-surface-container-highest/30">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            Récipes de {paciente?.nombre} {paciente?.apellido}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-container-highest rounded-full p-1.5 transition-colors">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Listado */}
        <div className="w-[220px] border-r border-outline-variant/30 flex flex-col bg-surface/50 shrink-0">
          <div className="p-4 border-b border-outline-variant/30">
            <button
              onClick={() => { setIsCreating(true); setEditingRecipeId(null); setRecipeToPrint(null); setFormData({ medicamentos: "", indicaciones: "", notas_adicionales: "" }); }}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Plus size={15} /> Nuevo Récipe
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
            ) : recipes.length === 0 ? (
              <p className="text-xs text-center text-on-surface-variant italic mt-4">No hay récipes registrados.</p>
            ) : (
              recipes.map(r => (
                <div
                  key={r.id}
                  onClick={() => { setIsCreating(false); setEditingRecipeId(null); setRecipeToPrint(r); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${recipeToPrint?.id === r.id && !isCreating ? "bg-primary/10 border-primary shadow-sm" : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/50"}`}
                >
                  <div className="text-xs font-bold text-on-surface mb-0.5">
                    {new Date(r.fecha_emision).toLocaleDateString("es-VE")}
                  </div>
                  <div className="text-[11px] text-on-surface-variant line-clamp-2">{r.medicamentos}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isCreating ? (
            <div className="flex flex-col h-full p-5">
              <h3 className="text-base font-bold mb-3 text-primary">{editingRecipeId ? "Editar Récipe" : "Redactar Nuevo Récipe"}</h3>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">Rp. (Medicamentos)</label>
                  <textarea
                    value={formData.medicamentos}
                    onChange={e => setFormData({ ...formData, medicamentos: e.target.value })}
                    className="flex-1 w-full bg-surface-container-highest/30 border border-outline-variant/30 rounded-2xl p-3 text-sm resize-none focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ej: Amoxicilina 500mg..."
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">Indicaciones</label>
                  <textarea
                    value={formData.indicaciones}
                    onChange={e => setFormData({ ...formData, indicaciones: e.target.value })}
                    className="flex-1 w-full bg-surface-container-highest/30 border border-outline-variant/30 rounded-2xl p-3 text-sm resize-none focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ej: Tomar 1 tableta cada 8 horas por 7 días..."
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-3">
                <button onClick={() => { setIsCreating(false); setEditingRecipeId(null); if(editingRecipeId) setRecipeToPrint(recipes.find(r => r.id === editingRecipeId) || null); }} className="px-5 py-2 rounded-xl hover:bg-surface-container-highest text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : "Guardar y Previsualizar"}
                </button>
              </div>
            </div>
          ) : recipeToPrint ? (
            <div className="flex flex-col h-full p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-on-surface">Vista Previa</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        medicamentos: recipeToPrint.medicamentos || "",
                        indicaciones: recipeToPrint.indicaciones || "",
                        notas_adicionales: recipeToPrint.notas_adicionales || ""
                      });
                      setEditingRecipeId(recipeToPrint.id);
                      setIsCreating(true);
                    }}
                    className="px-4 py-2 border border-primary/30 text-primary rounded-xl flex items-center gap-2 shadow-sm font-semibold text-sm hover:bg-primary/5 transition-all active:scale-95"
                  >
                    <Edit2 size={15} /> Editar
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl flex items-center gap-2 shadow-sm font-semibold text-sm hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <Printer size={15} /> Imprimir / Guardar PDF
                  </button>
                </div>
              </div>
              <PreviewCard recipe={recipeToPrint} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-40 p-6">
              <FileText size={56} className="mb-3" />
              <p className="text-sm">Selecciona un récipe o crea uno nuevo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const qrSourceElement = recipeToPrint ? (
    <div id="recipe-print-qr-source" className="hidden">
      <QRCodeSVG value={`${window.location.origin}/verificar/${recipeToPrint.qr_token}`} size={60} />
    </div>
  ) : null;

  if (isTab) {
    return (
      <>
        {content}
        {qrSourceElement}
      </>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/50 backdrop-blur-[3px] print:hidden"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full flex justify-center relative z-10"
        >
          {content}
        </motion.div>
        {qrSourceElement}
      </div>
    </AnimatePresence>
  );
}
