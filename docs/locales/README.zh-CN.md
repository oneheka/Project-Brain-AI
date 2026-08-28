<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>VS Code 代码库智能分析、架构防护与 AI 上下文工程工具。</b><br>
  <i>在 AI 修改代码前全面理解代码库 • 默认零云端依赖 • AST 与依赖图优先</i>
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
  <b>简体中文</b> •
  <a href="./README.ja.md">日本語</a> •
  <a href="./README.pt-BR.md">Português</a> •
  <a href="./README.es.md">Español</a> •
  <a href="./README.ko.md">한국어</a> •
  <a href="./README.de.md">Deutsch</a> •
  <a href="./README.fr.md">Français</a> •
  <a href="./README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 为什么选择 ProjectBrain？

在现代 AI 辅助开发（"vibe coding"）中，AI 代理虽然能迅速生成代码，但也容易引入架构隐患、重复逻辑、类型破坏以及上下文污染。

**ProjectBrain** 将混乱的 AI 生成代码库转变为有序且可验证的空间。它**不是**另一个自主写代码的代理，而是代码库的**观察者、分析器、守卫与上下文构建者**。

$$\text{静态分析 (AST/图)} \longrightarrow \text{启发式模板} \longrightarrow \text{本地 LLM (Ollama/HF)} \longrightarrow \text{云端 LLM (可选)}$$

---

## ⚡ 核心功能

* 🔍 **死代码与废弃符号追踪：** 递归分析调用树与引用图，精准识别废弃文件、未使用的导出、僵尸函数及孤立路由。
* 👥 **4 层重复逻辑检测：** 精确 AST → 控制流图 → 语法规范化 → 向量/LLM 推理，杜绝重复发明轮子。
* 🗺️ **端到端架构链路推导：** 自动构建路由到数据库表的完整调用链：
  $$\text{Route} \longrightarrow \text{Handler} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{Model} \longrightarrow \text{Table}$$
* 🎯 **AI 上下文工程与任务隔离：** 生成高精度提示词包，明确标记 `DO NOT DUPLICATE`，并在不同任务间隔离上下文。
* 🛡️ **AI 变更审查与快照对比：** 对比 AI 执行前后的代码快照，检测新增的类型错误、规则违规与密钥泄露。
* 🔒 **默认本地运行与隐私保护：** 所有索引与图数据库均存放在本地嵌入式 SQLite (`.projectbrain/`)。零数据上传，零未经授权的外网请求。

---

## 🚀 快速上手

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 许可证

采用 [MIT 许可证](../../LICENSE) 发布。由 [oneheka](https://github.com/oneheka) 用 ❤️ 打造。
