<div align="center">

# 🧠 ProjectBrain

<p align="center">
  <b>VS Code를 위한 코드베이스 인텔리전스, 아키텍처 가드레일 및 AI 컨텍스트 엔지니어링 도구.</b><br>
  <i>AI가 코드를 변경하기 전에 먼저 이해하세요 • 100% 로컬 프라이버시 기본 제공 • AST 및 그래프 우선</i>
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
  <b>한국어</b> •
  <a href="./README.de.md">Deutsch</a> •
  <a href="./README.fr.md">Français</a> •
  <a href="./README.uk.md">Українська</a>
</p>

---

</div>

## 🌟 왜 ProjectBrain인가요?

현대 AI 보조 개발("vibe coding") 환경에서 AI는 코드를 빠르게 작성하지만, 중복 유틸리티 생성, 타입 참조 오류 및 아키텍처 붕괴를 초래하기 쉽습니다.

**ProjectBrain**은 무질서한 AI 생성 코드베이스를 구조화되고 검증 가능한 환경으로 변환합니다. 직접 코드를 작성하는 AI 에이전트가 아니라, 코드베이스의 **관찰자, 분석자, 가드레일 및 컨텍스트 빌더** 역할을 수행합니다.

$$\text{정적 분석 (AST/그래프)} \longrightarrow \text{휴리스틱 템플릿} \longrightarrow \text{로컬 LLM (Ollama/HF)} \longrightarrow \text{클라우드 LLM (선택 사항)}$$

---

## ⚡ 주요 기능

* 🔍 **데드 코드 및 미사용 심볼 탐지:** 호출 그래프를 분석하여 미사용 파일, 내보내기 및 라우트를 식별합니다.
* 👥 **4단계 중복 코드 탐지:** 정확한 AST → 제어 흐름 그래프 → 정규화 → 로컬 벡터/LLM 추론으로 중복 생성을 방지합니다.
* 🗺️ **엔드투엔드 아키텍처 흐름 분석:** 라우트에서 데이터베이스 테이블까지의 호출 경로를 자동으로 추적합니다.
* 🎯 **AI 컨텍스트 최적화 & 작업 경계:** `DO NOT DUPLICATE` 지침이 포함된 정밀한 프롬프트 패킷을 생성합니다.
* 🛡️ **AI 변경 사항 리뷰 & 스냅샷:** 변경 전후를 비교하여 새로운 타입 오류 및 보안 키 유출을 차단합니다.
* 🔒 **완벽한 로컬 프라이버시:** 모든 데이터는 임베디드 SQLite (`.projectbrain/`)에 저장되며 외부로 유출되지 않습니다.

---

## 🚀 빠른 시작

```bash
git clone https://github.com/oneheka/Project-Brain-AI.git
cd Project-Brain-AI
bun install
bun run typecheck
bun run compile:vscode
```

---

## 📄 라이선스

[MIT 라이선스](../../LICENSE) 하에 배포됩니다. Developed with ❤️ by [oneheka](https://github.com/oneheka).
