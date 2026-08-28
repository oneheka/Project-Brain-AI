<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>VS Code 向けコードベースインテリジェンス・アーキテクチャガードレール・AIコンテキストエンジニアリング。</b><br>
  <i>AIが変更を加える前にコードベースを正しく理解する • デフォルト完全ローカル動作 • ASTとグラフ優先</i>
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
  <b>日本語</b> •
  <a href="./README.pt-BR.md">Português</a> •
  <a href="./README.es.md">Español</a> •
  <a href="./README.ko.md">한국어</a> •
  <a href="./README.de.md">Deutsch</a> •
  <a href="./README.fr.md">Français</a> •
  <a href="./README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 なぜ ProjectBrain なのか？

AIコーディング時代において、AIエージェントはコードを高速に生成する一方で、重複ロジック、壊れた型参照、アーキテクチャの崩壊を引き起こしがちです。

**ProjectBrain** は、AIによって生成された混沌としたコードベースを構造化され検証可能な空間へと導きます。AIに取って代わるのではなく、コードベースの **観察者・分析者・守護者・コンテキスト構築者** として機能します。

$$\text{静的解析 (AST/グラフ)} \longrightarrow \text{ヒューリスティックテンプレート} \longrightarrow \text{ローカル LLM} \longrightarrow \text{クラウド LLM (任意)}$$

---

## ⚡ 主な機能

* 🔍 **デッドコード & 未使用シンボルの検出:** 呼び出し関係を再帰的に解析し、未使用ファイル、エクスポート、孤立ルートを特定。
* 👥 **4段階の重複コード検出:** 厳密AST → 制御フローグラフ → 正規化 → ローカルLLM推論により重複実装を防止。
* 🗺️ **アーキテクチャフローの可視化:** ルートからデータベーステーブルまでの呼び出し経路を自動追跡。
* 🎯 **AIコンテキスト最適化 & タスク境界:** 高精度なプロンプトを生成し、タスク間の古い前提条件をリセット。
* 🛡️ **AI変更レビュー & スナップショット:** AIの編集前後を比較し、型の破損やシークレットの流出をブロック。
* 🔒 **安心のローカル動作:** 全データは埋め込み SQLite (`.projectbrain/`) に保存され、外部送信されません。

---

## 🚀 クイックスタート

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 ライセンス

[MIT ライセンス](../../LICENSE) の下で公開されています。Made with ❤️ by [oneheka](https://github.com/oneheka).
