<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>Анализ кодовой базы, архитектурные ограничения и генерация контекста для AI в VS Code.</b><br>
  <i>Поймите кодовую базу до того, как AI её изменит • Полная приватность • В приоритете AST и граф связей</i>
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
  <b>Русский</b> •
  <a href="./README.zh-CN.md">简体中文</a> •
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

## 🌟 Почему ProjectBrain?

В современной AI-assisted разработке ("vibe coding") нейросетевые агенты быстро генерируют код, но одновременно создают скрытые архитектурные проблемы: дублирование утилит, поломку типов, засорение контекста и потерю целостности проекта.

**ProjectBrain** превращает хаотичную AI-кодовую базу в структурированное и верифицируемое пространство. Это **не** ещё один генератор кода — это ваш **Наблюдатель, Анализатор, Страж и Конструктор контекста**.

$$\text{Статический анализ (AST/Граф)} \longrightarrow \text{Шаблоны эвристик} \longrightarrow \text{Локальная LLM (Ollama/HF)} \longrightarrow \text{Облачная LLM (Опционально)}$$

---

## ⚡ Ключевые возможности

* 🔍 **Поиск мертвого кода и забытых символов:** Рекурсивный анализ графа вызовов и ссылок для обнаружения неиспользуемых файлов, экспортов, зомби-функций и пустых API-роутов.
* 👥 **4-уровневое обнаружение дубликатов:** Точное AST → Граф потока управления → Нормализованный синтаксис → Векторный/LLM-анализ, предотвращающий повторное написание существующих функций.
* 🗺️ **Сквозной граф архитектуры:** Автоматическое построение цепочек:
  $$\text{Route} \longrightarrow \text{Handler} \longrightarrow \text{Service} \longrightarrow \text{Repository} \longrightarrow \text{Model} \longrightarrow \text{Table}$$
* 🎯 **AI Context Engineering & Task Boundaries:** Генерация точных промптов `.projectbrain/projectbrain-prompt.md` с секцией `DO NOT DUPLICATE` и изоляция контекста между задачами.
* 🛡️ **AI Change Review и снимки:** Сравнение слепков проекта до и после работы AI для выявления новых ошибок типов, нарушения конвенций и утечек ключей.
* 🔒 **Полная приватность по умолчанию:** Все индексы и графы хранятся локально во встроенной SQLite (`.projectbrain/`). Никакой телеметрии и несогласованных запросов в сеть.

---

## 🏛️ Архитектура монорепозитория

ProjectBrain построен на модульной структуре **Bun Workspaces**:

```text
projectbrain/
├── apps/
│   ├── vscode/               # @projectbrain/vscode (VS Code Extension VSIX)
│   └── cli/                  # @projectbrain/cli (Автономный CLI — в планах)
│
├── packages/
│   ├── shared/               # Доменные модели, интерфейсы AST и графа, DTO
│   ├── parser/               # Реестр AST-парсеров (TS, JS, SCSS, JSON, YAML)
│   ├── indexer/              # Быстрый сканер файлов и индексатор символов
│   ├── graph/                # Двунаправленный граф зависимостей и архитектуры
│   ├── analyzer/             # Движки поиска мертвого кода, дубликатов и здоровья компилятора
│   ├── rules/                # Декларативный движок правил и конвенций проекта (YAML)
│   ├── templates/            # Композиция эвристик и сопоставление шаблонов
│   ├── security/             # Сканер секретов, учетных данных и защита Git
│   ├── git/                  # Анализ истории репозитория, diff и веток
│   ├── ai/                   # AI Router, оценка релевантности, генератор промптов
│   └── core/                 # Главный оркестратор и локальное хранилище SQLite
│
└── template-pack/            # Встроенные шаблоны эвристик под фреймворки
```

---

## 🚀 Быстрый старт

### Требования
- [Bun](https://bun.sh) `v1.4.0+`
- [VS Code](https://code.visualstudio.com) `v1.90.0+`

### 1. Клонирование и установка
```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
```

### 2. Проверка типов и сборка
```bash
# Проверка типов во всем монорепозитории
bun run typecheck

# Компиляция расширения VS Code
bun run compile:vscode
```

### 3. Запуск в VS Code
Откройте проект в VS Code, перейдите во вкладку `Run & Debug` (`F5`) и выберите **"Launch Extension"**.

---

## 🔒 Безопасность и защита данных

* **Защита от утечек**: Ключи, приватные сертификаты (`.pem`), строки подключения и `.env` файлы строго игнорируются `.gitignore`.
* **Шаблон конфигурации**: Используйте `.env.example` для настройки опциональных локальных LLM (например, Ollama).
* **Git Guardrails**: Сканер безопасности проверяет индексированные изменения и историю коммитов.

---

## 📄 Лицензия

Распространяется под лицензией [MIT License](../../LICENSE). Разработано с ❤️ пользователем [oneheka](https://github.com/oneheka).
