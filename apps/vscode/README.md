<div align="center">

# 🧠 ProjectBrain for VS Code

<p align="center">
  <b>Codebase Intelligence, Architecture Guardrails & AI Context Engineering for VS Code.</b><br>
  <i>Understand the codebase before the AI changes it • Zero-Cloud by Default • AST & Graph First</i>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=oneheka.projectbrain-vscode"><img src="https://img.shields.io/badge/VS%20Code-v1.90+-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="VS Code"></a>
  <a href="https://github.com/oneheka/Project-Brain-AI"><img src="https://img.shields.io/badge/Version-v0.1.0--MVP-89b4fa?style=flat-square" alt="Version"></a>
  <a href="https://github.com/oneheka/Project-Brain-AI/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Offline-success?style=flat-square" alt="Offline">
</p>

---

</div>

## 🌟 Why ProjectBrain?

In modern AI-assisted development ("vibe coding"), LLM agents (like Claude, ChatGPT, Cursor, Copilot) quickly generate code, but also introduce **hidden architecture rot, duplicate utility functions, dead exports, exposed secrets, and hallucinated context**.

**ProjectBrain** transforms chaotic AI-generated codebases into a structured, verifiable workspace. It is your codebase's **Observer, Analyzer, Guard, and Context Builder**.

```text
Codebase AST & Dependency Graph ──► Multi-Layer Engine ──► AI Context Builder ──► Verified Safe Code
```

---

## ⚡ Core Features

### 1. 🏥 Project Health Score & Analytics (0–100)
Get instant, transparent scoring across 7 critical dimensions:
- **Architecture**: Coupling, layer separation, orphan nodes.
- **Code Quality**: Unused symbols, zombie functions, dead exports.
- **Security & Secrets**: 0-leak guarantee for API keys, tokens, and `.env` files.
- **Duplication**: Structural code clones and duplicate logic.
- **Type Safety**: TypeScript strictness and contract integrity.
- **Maintainability**: Long-term refactoring resilience.
- **AI Readiness**: How well your codebase is structured for external AI assistants.

### 2. 🗺️ Interactive Dependency Graph Webview
Visualize your entire architecture in an interactive 2D graph panel:
- **Architecture Layer Coloring**: Frontend (cyan), Backend (purple), Security (pink), Shared (emerald).
- **Physics-Driven Layout**: Zoom, Pan, Drag modules with auto-alignment by layer.
- **Module Inspector**: Click any node to view incoming/outgoing dependencies and jump directly into code with **"Open in Editor"**.
- **Search & Filter**: Instant module search and toggle for isolated (orphan) files.

### 3. 🔍 Dead Code & Zombie Symbol Hunter
Detects and categorizes unused code using 5 modular strategies:
- **`Definitely Unused`**: Private functions/classes with 0 incoming references.
- **`Probably Unused`**: Dead exports never imported anywhere in the workspace.
- **`Possibly Unused`**: Isolated files and unreachable routes.

### 4. 👥 Structural Duplicate Detection
Prevents AI agents from reinventing existing utilities:
- 2-phase comparison (Exact AST Hash + Structural LCS Matching) identifies duplicate helper functions across files, accounting for variable renaming.

### 5. 🛡️ Secret & Credential Scanner (18+ Patterns)
- Scans source code for leaked API keys (OpenAI, Anthropic, Gemini, AWS, Azure, GitHub, Stripe, DB URIs, JWT).
- **Env Auditor**: Ensures `.env` files are strictly listed in `.gitignore`.
- **Git History Auditor**: Catches secrets accidentally committed in earlier commits.

### 6. 🧠 AI Context Engineering & Prompt Builder
Before prompting an external LLM (Claude, ChatGPT, Cursor):
- Describe your task (e.g. *"Add rate limiting middleware"*).
- ProjectBrain automatically gathers **only relevant modules**, extracts **1-hop contract dependencies**, builds an **architecture overview**, and generates explicit **`DO NOT DUPLICATE` guardrails**.
- Ready-to-use markdown is automatically copied to your clipboard.

### 7. 📝 Task Session Lifecycle Manager
- Start a named task session before making AI changes.
- Record key architectural decisions (`addDecision`) and constraints (`addConstraint`).
- Automatically track git file changes and verify snapshots.
- Persistent session storage in `.projectbrain/sessions/`.

---

## 🖥️ Sidebar Tree Views

ProjectBrain contributes an Activity Bar view container with 5 specialized trees:

| Section | Description |
|---|---|
| **Overview & Health** | Detailed 0–100 health metrics with expandable positive and negative breakdown factors. |
| **Codebase & Architecture** | Discovered architecture layers, modules, entry points ⭐, and exported symbols. Click to jump. |
| **Quality & Dead Code** | Grouped dead code findings and duplicate code clusters. Click to open exact line. |
| **Security & Secrets** | Real-time risk level, exposed secrets, and environment file vulnerabilities. |
| **AI Context & Tasks** | Quick actions (Generate Prompt, Start Task), auto-detected conventions, and task sessions. |

---

## ⌨️ Commands Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)

| Command | Identifier | Description |
|---|---|---|
| **ProjectBrain: Analyze Project** | `projectbrain.analyze` | Runs AST parsing, builds dependency graph, and updates health score. |
| **ProjectBrain: Show Dependency Graph** | `projectbrain.showGraph` | Opens the interactive visual dependency graph webview panel. |
| **ProjectBrain: Generate AI Prompt** | `projectbrain.generatePrompt` | Creates a token-budgeted, guardrail-protected context prompt for LLMs. |
| **ProjectBrain: Find Dead Code** | `projectbrain.findDeadCode` | Opens QuickPick menu with dead code findings for fast navigation. |
| **ProjectBrain: Show Security Report** | `projectbrain.showSecurityReport` | Opens QuickPick menu with secret & `.env` security findings. |
| **ProjectBrain: Start Task Session** | `projectbrain.startTask` | Creates and activates a new persistent task session. |
| **ProjectBrain: Finish Task Session** | `projectbrain.finishTask` | Finalizes active task session and commits snapshot. |
| **ProjectBrain: Review AI Changes** | `projectbrain.reviewAiChanges` | Inspects uncommitted changes made during the task session. |
| **ProjectBrain: Refresh All Views** | `projectbrain.refreshAll` | Triggers a fresh re-scan of the workspace. |

---

## ⚙️ Extension Settings

Configure ProjectBrain in VS Code Settings (`Ctrl+,`):

```json
{
  // AI analysis mode (offline by default for privacy)
  "projectbrain.aiMode": "offline",

  // Local Ollama server endpoint (when using local AI mode)
  "projectbrain.ollamaEndpoint": "http://localhost:11434"
}
```

---

## 🔒 Privacy & Security First

- **100% Local & Offline**: All AST parsing, graph calculations, duplicate detection, and secret scanning execute locally on your machine.
- **Zero Telemetry**: No tracking, no external server calls, no telemetry beacons.
- **Safe Prompting**: Masked secrets ensure sensitive credentials are never included in generated AI prompts.

---

## 📄 License

MIT License © 2026 [Romanov Roman (oneheka)](https://github.com/oneheka)
