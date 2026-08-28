<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>Codebase Intelligence, Architecture Guardrails & AI Context Engineering for VS Code.</b><br>
  <i>Understand the codebase before the AI changes it • Zero-Cloud by Default • AST & Graph First</i>
</p>

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Runtime-Bun%20v1.4+-fbf0df?style=flat-square&logo=bun&logoColor=black" alt="Bun"></a>
  <a href="https://code.visualstudio.com"><img src="https://img.shields.io/badge/VS%20Code-v1.90+-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://www.sqlite.org"><img src="https://img.shields.io/badge/Storage-SQLite%20Embedded-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <b>English</b> •
  <a href="./docs/locales/README.ru.md">Русский</a> •
  <a href="./docs/locales/README.zh-CN.md">简体中文</a> •
  <a href="./docs/locales/README.ja.md">日本語</a> •
  <a href="./docs/locales/README.pt-BR.md">Português</a> •
  <a href="./docs/locales/README.es.md">Español</a> •
  <a href="./docs/locales/README.ko.md">한국어</a> •
  <a href="./docs/locales/README.de.md">Deutsch</a> •
  <a href="./docs/locales/README.fr.md">Français</a> •
  <a href="./docs/locales/README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 Why ProjectBrain?

In modern AI-assisted development ("vibe coding"), LLM agents quickly generate code, but also introduce hidden architecture rot, duplicate utilities, broken type references, and hallucinated context.

**ProjectBrain** transforms chaotic AI-generated codebases into a structured, verifiable workspace. It is **not** another autonomous code generator — it is your codebase's **Observer, Analyzer, Guard, and Context Builder**.

$$\text{Static Analysis (AST/Graph)} \longrightarrow \text{Templates} \longrightarrow \text{Local LLM (Ollama/HF)} \longrightarrow \text{Cloud LLM (Optional)}$$

---

## ⚡ Key Highlights

* 🔍 **Dead Code & Zombie Symbol Hunter:** Recursively analyzes call trees and incoming reference graphs to identify dead files, unused exports, zombie functions, and orphaned API routes.
* 👥 **Semantic & Structural Duplicate Detection:** 4-tier comparison (Exact AST → Control Flow Graph → Normalized Syntax → Local Vector/LLM Reasoning) prevents AI agents from reinventing existing functions.
* 🗺️ **Full Architecture Flow Discovery:** Automatically traces end-to-end pathways:
  $$\text{Route} \longrightarrow \text{Handler} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{Model} \longrightarrow \text{Database Table}$$
* 🎯 **AI Context Engineering & Task Boundaries:** Generates pinpoint `.projectbrain/projectbrain-prompt.md` context packets with explicit `DO NOT DUPLICATE` guardrails and resets stale context between task sessions.
* 🛡️ **AI Change Review & Snapshots:** Compares codebase snapshots before and after AI agent execution, catching new type errors, convention breaches, and leaked secrets.
* 🔒 **Zero-Cloud Privacy by Default:** All indexation and graph databases run locally in embedded SQLite (`.projectbrain/`). Zero telemetry, zero unauthorized external network calls.

---

## 🏛️ Monorepo Architecture

ProjectBrain is engineered with a modular, decoupled architecture powered by **Bun Workspaces**:

```text
projectbrain/
├── apps/
│   ├── vscode/               # @projectbrain/vscode (VS Code Extension VSIX)
│   └── cli/                  # @projectbrain/cli (Standalone CLI — Planned)
│
├── packages/
│   ├── shared/               # Domain models, AST & Graph interfaces, DTOs
│   ├── parser/               # Multi-language AST parser registry (TS, JS, SCSS, JSON, YAML)
│   ├── indexer/              # High-speed workspace crawler & symbol indexer
│   ├── graph/                # Bidirectional dependency & architecture flow graph
│   ├── analyzer/             # Dead code engine, duplicate detector, compiler health
│   ├── rules/                # Declarative YAML project convention rule engine
│   ├── templates/            # Weighted heuristic composition & template matcher
│   ├── security/             # Secret scanner, credentials detector & git guardrails
│   ├── git/                  # Repository history, diff & branch analyzer
│   ├── ai/                   # AI Router, Relevance scoring, Prompt builder
│   └── core/                 # Central orchestrator & local SQLite storage manager
│
└── template-pack/            # Built-in framework & architectural heuristic templates
```

---

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) `v1.4.0+`
- [VS Code](https://code.visualstudio.com) `v1.90.0+`

### 1. Clone & Install
```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
```

### 2. Typecheck & Build
```bash
# Run typecheck across all workspace packages
bun run typecheck

# Compile VS Code extension
bun run compile:vscode
```

### 3. Launch in VS Code
Open the project in VS Code, navigate to the `Run & Debug` panel (`F5`), and select **"Launch Extension"** to spin up an Extension Development Host.

---

## 🔒 Strict Security Guardrails

* **Zero Leaks**: Secrets, private keys (`.pem`), connection strings, and `.env` files are strictly ignored by `.gitignore`.
* **Safe Configuration**: Use `.env.example` as a reference when configuring optional local LLM providers (e.g. Ollama).
* **Git Guardrails**: The security scanner inspects staged changes and commit history to ensure no sensitive credentials are ever committed.

---

## 📄 License

Distributed under the [MIT License](./LICENSE). Developed with ❤️ by [oneheka](https://github.com/oneheka).
