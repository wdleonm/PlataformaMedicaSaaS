const fs = require('fs');

const path = 'c:\\xampp\\htdocs\\github\\PlataformaMedicaSaaS\\frontend\\src\\app\\(dashboard)\\historias\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');

const startIdx = lines.findIndex(line => line.includes('{isLoadingSecciones ? ('));
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes('</div>')) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const newChunk = `                  {isLoadingSecciones ? (
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                      <Loader2 size={14} className="animate-spin" /> Cargando secciones...
                    </div>
                  ) : (() => {
                    const isStepComplete = (codigo) => {
                      if (!formData) return false;
                      switch (codigo) {
                        case "CONSULTA": return formData.motivo_consulta?.trim() !== "" || formData.enfermedad_actual?.trim() !== "";
                        case "ANTECEDENTES": return formData.antecedentes_personales?.patologias?.length > 0 || formData.antecedentes_personales?.medicamentos?.trim() !== "";
                        case "EXAMEN_FISICO": return formData.examen_clinico?.observaciones?.trim() !== "" || (formData.examen_clinico?.encias && formData.examen_clinico.encias !== "");
                        case "PLAN": return formData.plan_tratamiento?.trim() !== "";
                        case "ACTIVIDADES": return formData.actividades_realizadas?.trim() !== "";
                        default: return false;
                      }
                    };
                    return secciones.map((s, idx) => {
                      const completed = isStepComplete(s.codigo);
                      return (
                        <button key={s.id} type="button" onClick={() => setCurrentStepIdx(idx)}
                          className={\`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 border \${currentStepIdx === idx ? "bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(77,158,170,0.2)] scale-105" : (completed ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-surface border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest hover:border-outline-variant/50")}\`}>
                          <span className={\`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] \${currentStepIdx === idx ? "border-primary" : (completed ? "border-green-500" : "border-current")}\`}>
                            {completed ? <CheckCircle2 size={10} /> : idx + 1}
                          </span>
                          {s.nombre}
                        </button>
                      );
                    });
                  })()}
`;

  lines.splice(startIdx, endIdx - startIdx, newChunk);
  
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Fixed syntax error in historias/page.tsx');
} else {
  console.log('Could not find chunk bounds');
}
