# News Curation Bot

> AI・世界経済・金融の最新ニュースを自動収集するボット

[![CI](https://github.com/imloveit0106-crypto/news-curation-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/imloveit0106-crypto/news-curation-bot/actions/workflows/ci.yml)
[![Daily News](https://github.com/imloveit0106-crypto/news-curation-bot/actions/workflows/daily-news.yml/badge.svg)](https://github.com/imloveit0106-crypto/news-curation-bot/actions/workflows/daily-news.yml)

---

## Overview

**News Curation Bot** は、Google News RSS から最新ニュースを自動収集し、整形して表示する TypeScript 製のボットです。

毎日決まった時間に GitHub Actions で自動実行され、忙しいあなたの代わりに情報収集を行います。

### 収集カテゴリ

| カテゴリ | 収集キーワード |
|---------|---------------|
| **AI・LLM** | AI, LLM, OpenAI, NVIDIA, ChatGPT, Claude |
| **世界経済** | 世界経済, グローバル経済, GDP |
| **金融速報** | 金融, 株式市場, 為替, 日銀 |

> 恋愛・エンタメ系のニュースは自動でフィルタリングされます

---

## Quick Start

### Prerequisites

- Node.js 18.0.0 以上
- npm

### Installation

```bash
# リポジトリをクローン
git clone https://github.com/imloveit0106-crypto/news-curation-bot.git
cd news-curation-bot

# 依存パッケージをインストール
npm install

# ビルド
npm run build

# 実行
npm run start
```

### Output Example

```
╔════════════════════════════════════════════════════════════════╗
║           📰 News Curation Bot - 最新ニュース                  ║
╚════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 AI・LLM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📄 2026年、AIの未来を揺さぶる6つの予測
     🏢 WIRED.jp | 🕐 1月5日 07:00
     🔗 https://news.google.com/...
```

---

## Automation

### GitHub Actions

このボットは **毎日朝8時（日本時間）** に自動実行されます。

| ワークフロー | トリガー | 説明 |
|-------------|---------|------|
| `ci.yml` | Push / PR | コード品質チェック（Lint, Build） |
| `daily-news.yml` | 毎日 8:00 JST | ニュース自動取得 |

### ログの確認方法

1. [**Actions タブ**](https://github.com/imloveit0106-crypto/news-curation-bot/actions) にアクセス
2. **Daily News Curation** ワークフローをクリック
3. 最新の実行をクリック
4. **fetch-news** ジョブを展開
5. 「Fetch latest news」ステップでニュース一覧を確認

### 手動実行

Actions タブから **Run workflow** ボタンで即座に実行できます。

---

## Development

### Available Scripts

```bash
npm run build        # TypeScript をコンパイル
npm run start        # ボットを実行
npm run dev          # 開発モードで実行
npm run lint         # ESLint でコードチェック
npm run lint:fix     # ESLint で自動修正
npm run format       # Prettier でコード整形
npm run format:check # 整形チェックのみ
```

### Project Structure

```
news-curation-bot/
├── .github/
│   └── workflows/
│       ├── ci.yml           # CI ワークフロー
│       └── daily-news.yml   # 毎日自動実行
├── src/
│   └── index.ts             # メインロジック
├── dist/                    # ビルド成果物
├── package.json
├── tsconfig.json
├── .eslintrc.json
└── .prettierrc
```

---

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Linter**: ESLint
- **Formatter**: Prettier
- **CI/CD**: GitHub Actions
- **RSS Parser**: rss-parser

---

## License

MIT License
