<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>Codebase Intelligence, Architektur-Guardrails & AI-Kontext-Engineering für VS Code.</b><br>
  <i>Verstehe die Codebasis, bevor die KI sie verändert • Standardmäßig 100% lokal • AST & Graphen zuerst</i>
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
  <a href="./README.es.md">Español</a> •
  <a href="./README.ko.md">한국어</a> •
  <b>Deutsch</b> •
  <a href="./README.fr.md">Français</a> •
  <a href="./README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 Warum ProjectBrain?

In der modernen KI-gestützten Softwareentwicklung ("Vibe Coding") erzeugen LLM-Agenten Code in rasantem Tempo, führen jedoch häufig zu redundanter Logik, Architekturbrüchen und unsauberem Kontext.

**ProjectBrain** verwandelt chaotische KI-Codebasen in eine strukturierte, überprüfbare Umgebung. Es fungiert als **Beobachter, Analysator, Wächter und Kontext-Builder**.

$$\text{Statische Analyse (AST/Graph)} \longrightarrow \text{Heuristische Vorlagen} \longrightarrow \text{Lokale LLM (Ollama/HF)} \longrightarrow \text{Cloud LLM (Optional)}$$

---

## ⚡ Hauptmerkmale

* 🔍 **Dead-Code & Zombie-Symbol-Erkennung:** Rekursive Analyse von Aufruf- und Referenzgraphen zur Erkennung ungenutzter Dateien, Exporte und Routen.
* 👥 **4-Stufen-Duplikaterkennung:** Exakter AST → Kontrollflussgraph → Normalisierte Syntax → Lokale Vektor-/LLM-Logik.
* 🗺️ **Architektur-Ablaufanalyse:** Automatische Nachverfolgung von Routen bis hin zu Datenbanktabellen.
* 🎯 **KI-Kontext-Optimierung & Task Boundaries:** Punktgenaue Prompts mit expliziten `DO NOT DUPLICATE`-Leitplanken.
* 🛡️ **KI-Änderungsprüfung & Snapshots:** Vorher-Nachher-Vergleiche zum Schutz vor Typfehlern und Secrets-Leaks.
* 🔒 **Maximale Privatsphäre:** Lokale SQLite-Datenbank (`.projectbrain/`). Keine Telemetrie.

---

## 🚀 Schnellstart

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 Lizenz

Veröffentlicht unter der [MIT-Lizenz](../../LICENSE). Entwickelt mit ❤️ von [oneheka](https://github.com/oneheka).
