# 🤖 Rutina Diaria y Prompts AI-DLC

Este documento contiene los comandos exactos para inicializar y cerrar sesiones de trabajo con el asistente de IA bajo el marco metodológico AI-DLC (Enfoque Web-First).

---

## 🌅 1. Prompt de Inicialización (Check-In)

**Cuándo usarlo:** Al abrir el IDE (VS Code, AntiGravity, etc.) para iniciar tu jornada o al abrir un nuevo hilo de chat con la IA.

**Instrucción a copiar:**

> Hola. Vamos a desarrollar y optimizar este proyecto bajo el marco metodológico AI-DLC utilizando nuestro IDE. Por favor, realiza una búsqueda en internet o consulta directamente el repositorio oficial `https://github.com/awslabs/aidlc-workflows` para extraer las reglas actualizadas del archivo `core-workflow.md` y las especificaciones de fase en `aws-aidlc-rule-details`.
>
> Lee nuestro archivo local de control de estado en `.ai-dlc/aidlc-state.md` para conocer nuestra fase de trabajo actual y confírmame las reglas web que aplicarás para comenzar. Posteriormente, analiza los documentos históricos en `requerimientos/specs/` para entender la arquitectura base.

---

## 🌇 2. Prompt de Cierre de Sesión (Check-Out)

**Cuándo usarlo:** Al finalizar tu jornada laboral o al terminar de refactorizar un módulo importante, para obligar a la IA a registrar el progreso.

**Instrucción a copiar:**

> Actualiza nuestro archivo `.ai-dlc/aidlc-state.md` para reflejar el progreso de las tareas y optimizaciones realizadas hoy, manteniendo el formato metodológico. Añade un apunte en el "Registro de Decisiones" detallando exactamente los módulos que modificamos o las validaciones de calidad que superamos hoy.

---

## 🛑 Regla de Oro (Compuertas de Calidad)

- Queda estrictamente prohibido permitir que la IA genere código nuevo si no ha validado previamente que las especificaciones están completas en la carpeta `requerimientos/`.
- Todo avance debe quedar plasmado con una `[x]` en el archivo `aidlc-state.md`.
