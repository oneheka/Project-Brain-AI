<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>Intelligence de codebase, garde-fous d'architecture et ingénierie de contexte IA pour VS Code.</b><br>
  <i>Comprenez la base de code avant que l'IA ne la modifie • 100% local par défaut • Priorité AST et Graphes</i>
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
  <a href="./README.de.md">Deutsch</a> •
  <b>Français</b> •
  <a href="./README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 Pourquoi ProjectBrain ?

Dans le développement moderne assisté par IA ("vibe coding"), les agents LLM génèrent du code rapidement mais introduisent fréquemment du code dupliqué, des ruptures de types et de la pollution de contexte.

**ProjectBrain** transforme une base de code générée par IA en un espace structuré et vérifiable. Il agit comme un **Observateur, Analyste, Gardien et Constructeur de Contexte**.

$$\text{Analyse statique (AST/Graphe)} \longrightarrow \text{Modèles heuristiques} \longrightarrow \text{LLM Local (Ollama/HF)} \longrightarrow \text{LLM Cloud (Optionnel)}$$

---

## ⚡ Fonctionnalités Clés

* 🔍 **Détection de code mort :** Analyse récursive des graphes d'appels pour trouver les fichiers, exports et routes orphelines.
* 👥 **Détection de duplications en 4 niveaux :** AST exact → Graphe de flux de contrôle → Normalisation syntaxique → Raisonnement vectoriel/LLM.
* 🗺️ **Cartographie d'architecture :** Traçage automatique des routes jusqu'aux tables de base de données.
* 🎯 **Ingénierie de contexte IA :** Prompts ciblés avec garde-fous explicites `DO NOT DUPLICATE`.
* 🛡️ **Revue des changements IA :** Comparaison de snapshots pour détecter les régressions et fuites de clés.
* 🔒 **Respect total de la vie privée :** Données stockées localement via SQLite embarqué (`.projectbrain/`).

---

## 🚀 Démarrage Rapide

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 Licence

Distribué sous la [Licence MIT](../../LICENSE). Créé avec ❤️ par [oneheka](https://github.com/oneheka).
