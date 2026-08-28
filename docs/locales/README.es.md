<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>Inteligencia de código base, salvaguardas de arquitectura e ingeniería de contexto de IA para VS Code.</b><br>
  <i>Comprende el código antes de que la IA lo modifique • 100% local por defecto • Enfoque en AST y Grafos</i>
</p>

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Runtime-Bun%20v1.4+-fbf0df?style=flat-square&logo=bun&logoColor=black" alt="Bun"></a>
  <a href="https://code.visualstudio.com"><img src="https://img.shields.io/badge/VS%20Code-v1.90+-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://www.sqlite.org"><img src="https://img.shields.io/badge/Storage-SQLite%20Embedded-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite"></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <a href="../../README.md">English</a> •
  <a href="./README.ru.md">Русский</a> •
  <a href="./README.zh-CN.md">简体中文</a> •
  <a href="./README.ja.md">日本語</a> •
  <a href="./README.pt-BR.md">Português</a> •
  <b>Español</b> •
  <a href="./README.ko.md">한국어</a> •
  <a href="./README.de.md">Deutsch</a> •
  <a href="./README.fr.md">Français</a> •
  <a href="./README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 ¿Por qué ProjectBrain?

En el desarrollo asistido por IA ("vibe coding"), los agentes LLM generan código con rapidez, pero frecuentemente introducen duplicación de lógica, errores de tipos e inconsistencias arquitectónicas.

**ProjectBrain** convierte el desorden generado por IA en una base de código estructurada y verificable, actuando como **Observador, Analizador, Guardián y Constructor de Contexto**.

$$\text{Análisis Estático (AST/Grafo)} \longrightarrow \text{Plantillas Heurísticas} \longrightarrow \text{LLM Local (Ollama/HF)} \longrightarrow \text{LLM en la Nube (Opcional)}$$

---

## ⚡ Características Clave

* 🔍 **Detección de Código Muerto:** Rastrea árboles de llamadas para identificar archivos, exportaciones y rutas de API no utilizadas.
* 👥 **Detección de Duplicados en 4 Niveles:** AST exacto → Flujo de control → Normalización sintáctica → Razonamiento semántico local.
* 🗺️ **Descubrimiento de Arquitectura:** Mapeo automático desde endpoints hasta tablas de base de datos.
* 🎯 **Ingeniería de Contexto y Delimitación de Tareas:** Contexto limpio para IA con directivas explícitas de `DO NOT DUPLICATE`.
* 🛡️ **Revisión de Cambios de IA:** Comparación de snapshots antes y después de cada edición.
* 🔒 **Privacidad Total:** Base de datos SQLite integrada localmente en `.projectbrain/`.

---

## 🚀 Inicio Rápido

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 Licencia

Distribuido bajo la [Licencia MIT](../../LICENSE). Creado con ❤️ por [oneheka](https://github.com/oneheka).
