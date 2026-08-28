<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>Inteligência de base de código, proteção de arquitetura e engenharia de contexto de IA para VS Code.</b><br>
  <i>Entenda a base de código antes que a IA a modifique • Totalmente local por padrão • Foco em AST e Grafos</i>
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
  <b>Português</b> •
  <a href="./README.es.md">Español</a> •
  <a href="./README.ko.md">한국어</a> •
  <a href="./README.de.md">Deutsch</a> •
  <a href="./README.fr.md">Français</a> •
  <a href="./README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 Por que o ProjectBrain?

No desenvolvimento moderno assistido por IA ("vibe coding"), agentes LLM geram código rapidamente, mas frequentemente introduzem duplicações, inconsistências de tipo e quebras de arquitetura.

O **ProjectBrain** transforma bases de código caóticas geradas por IA em um ambiente estruturado e verificável. Ele atua como **Observador, Analisador, Guardião e Construtor de Contexto**.

$$\text{Análise Estática (AST/Grafo)} \longrightarrow \text{Modelos Heurísticos} \longrightarrow \text{LLM Local (Ollama/HF)} \longrightarrow \text{LLM em Nuvem (Opcional)}$$

---

## ⚡ Recursos Principais

* 🔍 **Detecção de Código Morto:** Análise detalhada de grafos de chamadas para encontrar arquivos não utilizados, funções fantasmas e rotas órfãs.
* 👥 **Detecção de Duplicações em 4 Níveis:** AST exato → Grafo de fluxo de controle → Sintaxe normalizada → Raciocínio vetorial/LLM.
* 🗺️ **Mapeamento de Fluxos Arquiteturais:** Rastreamento completo de rotas até tabelas de banco de dados.
* 🎯 **Engenharia de Contexto de IA:** Prompts concisos com regras explícitas de `DO NOT DUPLICATE`.
* 🛡️ **Revisão de Alterações de IA:** Comparação de snapshots para evitar quebras de convenções e vazamentos de chaves/segredos.
* 🔒 **Privacidade Total:** Armazenamento local com SQLite embarcado (`.projectbrain/`). Zero telemetria.

---

## 🚀 Início Rápido

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 Licença

Distribuído sob a licença [MIT](../../LICENSE). Desenvolvido com ❤️ por [oneheka](https://github.com/oneheka).
