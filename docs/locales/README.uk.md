<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>Аналіз кодової бази, архітектурні обмеження та інженерія контексту для AI у VS Code.</b><br>
  <i>Зрозумійте кодову базу до того, як AI її змінить • Повна приватність • Пріоритет AST та графа зв'язків</i>
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
  <a href="./README.fr.md">Français</a> •
  <b>Українська</b>
</p>

---

</div>

## 🌟 Чому ProjectBrain?

У сучасній AI-розробці ("vibe coding") нейромережеві агенти швидко створюють код, проте одночасно породжують приховані архітектурні дефекти: дублювання утиліт, злам типів, засмічення контексту та руйнування архітектурних меж.

**ProjectBrain** перетворює хаотичну AI-кодову базу на структурований і безпечний простір. Він виступає як **Спостерігач, Аналізатор, Вартовий та Конструктор контексту**.

$$\text{Статичний аналіз (AST/Граф)} \longrightarrow \text{Шаблони евристик} \longrightarrow \text{Локальна LLM (Ollama/HF)} \longrightarrow \text{Хмарна LLM (Опціонально)}$$

---

## ⚡ Ключові можливості

* 🔍 **Пошук мертвого коду та забутих символів:** Рекурсивний аналіз викликів і посилань для виявлення невикористаних файлів, експортів і порожніх маршрутів.
* 👥 **4-рівневий аналіз дублікатів:** Точне AST → Граф потоку керування → Нормалізований синтаксис → Векторний/LLM-аналіз.
* 🗺️ **Наскрізний граф архітектури:** Автоматична побудова ланцюжків від маршрутів до таблиць баз даних.
* 🎯 **AI Context Engineering & Task Boundaries:** Генерація точних промптів із секцією `DO NOT DUPLICATE` та ізоляція контексту між задачами.
* 🛡️ **AI Change Review та знімки:** Порівняння стану кодової бази до та після роботи AI.
* 🔒 **Повна приватність:** Зберігання всіх індексів та графів у вбудованій SQLite (`.projectbrain/`).

---

## 🚀 Швидкий старт

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 Ліцензія

Розповсюджується під ліцензією [MIT License](../../LICENSE). Створено з ❤️ користувачем [oneheka](https://github.com/oneheka).
