# 🏥 Guía de Escalabilidad Modular: Otras Especialidades (Fase 15)

Este documento define la estructura médica y técnica para expandir el SaaS a otras ramas de la medicina. Está diseñado para reutilizar el ** Motor de Secciones Dinámicas** (Fase 8) ya implementado.

## 1. 🏗️ Estructura Troncal (Universal)
Todas las historias clínicas, sin importar la especialidad, deben compartir esta base de datos troncal:

*   **Identificación:** Nombre, Cédula/ID, Edad, Sexo, Ocupación.
*   **Motivo de Consulta:** (Texto breve).
*   **Enfermedad Actual:** (Texto enriquecido).
*   **Antecedentes:** Patológicos, Quirúrgicos, Alérgicos, Familiares y Hábitos (Tabaco, Alcohol, Sueño).
*   **Signos Vitales:** TA (Tensión), FC (Frecuencia Cardiaca), FR (Frecuencia Respiratoria), Temperatura, Peso, Talla e IMC (Cálculo automático).

---

## 2. 🧬 Módulos Clínicos por Especialidad

### A. Medicina General e Interna
El foco es la revisión sistémica profunda y el riesgo crónico.
*   **Examen Físico Segmentario:** Cabeza, Cuello, Tórax, Abdomen, Extremidades y Neurológico.
*   **Revisión por Sistemas:** Respiratorio, Cardiovascular, Digestivo, Genitourinario.
*   **Control de Crónicos:** Registro de Diabetes (HbA1c) y Perfil Lipídico.
*   **Particularidad Técnica:** Tabla de Riesgo (Score de Framingham) calculado automáticamente.

### B. Pediatría
Foco en el Crecimiento y Desarrollo.
*   **Antecedentes Perinatales:** Semanas de gestación, tipo de parto, peso al nacer, APGAR.
*   **Módulo de Crecimiento (Percentiles):** Gráficas de Peso/Edad, Talla/Edad y Perímetro Cefálico.
*   **Hitos del Desarrollo:** Seguimiento de gateo, habla, etc.
*   **Esquema de Vacunación:** Lista de chequeo dinámica por edad.
*   **Técnico:** Consumir API de la OMS para graficar los percentiles automáticamente.

### C. Ginecología y Obstetricia
Enfoque en salud hormonal y reproductiva.
*   **Antecedentes Gineco-Obstétricos:** MENARQUIA, FUR (Última Regla), Ciclos y GESTA (G, P, A, C).
*   **Vida Sexual:** Inicio, número de parejas, método anticonceptivo.
*   **Mapa de Citología/VPH:** Última toma y resultado histórico.
*   **Examen Mamario Visual:** Mapa visual de cuadrantes interactivo para marcar hallazgos.

### D. Traumatología
Enfoque mecánico, funcional y dolor.
*   **Descripción de la Lesión:** Fecha y mecanismo del trauma (caída, choque, etc.).
*   **Examen Osteomuscular:** Inspección (edema, deformidad), Palpación y Arcos de Movilidad.
*   **Mapa Esquelético Visual:** Selector visual de huesos para marcar fracturas o inflamación.
*   **Escala EVA:** Barra deslizante de dolor (1-10).

### E. Toxicología
Enfoque en exposición y síntomas sistémicos.
*   **Historia de Exposición:** Sustancia, vía (oral, inhalada, etc.) y tiempo.
*   **Checklist de Toxidromes:** Selección rápida de síndromes toxicológicos.
*   **Seguimiento de Antídotos:** Tabla de dosis y seguimiento de niveles plasmáticos.

---

## 3. 🛠️ Hoja de Ruta Técnica (Próximos Pasos)

Para activar una especialidad de las anteriores, los pasos a seguir son:

1.  **Backend (DB Meta):** 
    *   Registrar la especialidad en `sys_config.especialidades`.
    *   Crear las nuevas secciones en `sys_config.hc_secciones` (ej: `PERCENTILES_DOC`).
    *   Mapearlas en `sys_config.especialidad_hc_secciones`.
2.  **Frontend (UI Modular):** 
    *   Crear el componente React para el módulo (ej: `BodyMapTrauma.tsx`).
    *   Añadir el caso en el `switch` de `renderSeccion` del modal de historias.
3.  **Almacenamiento (JSONB):** 
    *   Utilizar la columna `data_especifica JSONB` en la tabla de historias para guardar los campos dinámicos de cada especialidad sin necesidad de crear una tabla SQL nueva por cada una.

---
> [!IMPORTANT]
> **Visión:** El éxito de esta estructura es que el especialista solo verá la "caja de herramientas" (pestañas) que necesita, manteniendo el sistema limpio y ultra-rápido.
