# 技術仕様書 - News Curation Bot Pro Edition

**バージョン**: 1.0.0
**最終更新日**: 2026-01-06
**ステータス**: 本番運用中

---

## 目次

1. [システム概要](#システム概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [技術スタック](#技術スタック)
4. [機能仕様](#機能仕様)
5. [データモデル](#データモデル)
6. [アルゴリズム詳細](#アルゴリズム詳細)
7. [設定・カスタマイズ](#設定カスタマイズ)
8. [デプロイメント](#デプロイメント)
9. [運用・監視](#運用監視)
10. [制約事項・前提条件](#制約事項前提条件)
11. [今後の拡張性](#今後の拡張性)

---

## システム概要

### プロジェクト目的

AI・世界経済・金融に関する最新ニュースを**自動収集・分析・配信**するインテリジェントなニュースキュレーションシステム。

### 主要機能

- **多言語ソース対応**: 日本語・英語のニュースソースから情報収集
- **重要度判定**: キーワードベースのAI・半導体・金融関連ニュースの自動評価
- **重複排除**: 履歴管理による既読記事の自動フィルタリング
- **ノイズ除去**: 恋愛・エンタメ系コンテンツの自動除外
- **自動実行**: GitHub Actionsによる毎日定時実行
- **スケーラブル設計**: 新規ソース・カテゴリの簡単追加

### システム特性

- **実行環境**: GitHub Actions (Ubuntu Latest)
- **実行頻度**: 毎日 8:00 JST (Cron: `0 23 * * *` UTC)
- **処理時間**: 平均 30-60秒 (ネットワーク状態に依存)
- **出力形式**: コンソールログ（GitHub Actions ログ）

---

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Runner                     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Daily News Curation Workflow              │  │
│  │                                                         │  │
│  │  1. [Checkout] ────────────────────────────────────┐   │  │
│  │  2. [Setup Node.js 20]                             │   │  │
│  │  3. [Install Dependencies (npm ci)]                │   │  │
│  │  4. [Build TypeScript (tsc)]                       │   │  │
│  │  5. [Restore History Cache] ◄──────┐               │   │  │
│  │  6. [Execute Bot (node dist/index.js)]             │   │  │
│  │  7. [Save History Cache] ──────────┤               │   │  │
│  │  8. [Generate Summary Report]      │               │   │  │
│  │                                     │               │   │  │
│  │                                     ▼               │   │  │
│  │                         ┌─────────────────────┐    │   │  │
│  │                         │  Actions Cache API  │    │   │  │
│  │                         │  (history.json)     │    │   │  │
│  │                         └─────────────────────┘    │   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│                              ▼                                │
│                   ┌─────────────────────┐                    │
│                   │   News Output Log   │                    │
│                   │  (Console Display)  │                    │
│                   └─────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘

            ▲                     ▲                    ▲
            │                     │                    │
     ┌──────┴──────┐      ┌──────┴──────┐     ┌──────┴──────┐
     │ Google News │      │ The Verge   │     │   Reuters   │
     │  RSS Feeds  │      │  RSS Feed   │     │  RSS Feed   │
     └─────────────┘      └─────────────┘     └─────────────┘
```

### コンポーネント構成

#### 1. **メインアプリケーション** (`src/index.ts`)
- RSS フィードの並列取得
- データ変換・整形
- 重要度判定エンジン
- 重複排除ロジック
- コンソール出力フォーマッター

#### 2. **CI/CD パイプライン**
- **CI Workflow** (`.github/workflows/ci.yml`)
  - コード品質チェック (ESLint, Prettier)
  - TypeScript ビルド検証
  - マルチバージョンテスト (Node.js 18.x, 20.x)

- **Daily News Workflow** (`.github/workflows/daily-news.yml`)
  - Cron スケジュール実行
  - 履歴キャッシュ管理
  - 手動トリガー対応

#### 3. **データストレージ**
- **履歴ファイル**: `data/history.json`
  - GitHub Actions Cache API にキャッシュ
  - 最大500件の既読記事タイトルを保持
  - 自動クリーンアップ機能

---

## 技術スタック

### 実行環境

| 項目 | 技術 | バージョン |
|------|------|-----------|
| **Runtime** | Node.js | >= 18.0.0 |
| **言語** | TypeScript | ^5.3.0 |
| **パッケージマネージャ** | npm | (Node.js bundled) |

### 主要ライブラリ

```json
{
  "dependencies": {
    "rss-parser": "^3.13.0"  // RSS/Atom フィードパーサー
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.1.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.0"
  }
}
```

### ビルド設定

**TypeScript コンパイラオプション** (`tsconfig.json`):
```json
{
  "target": "ES2022",           // 最新のECMAScript機能を使用
  "module": "commonjs",         // Node.js互換モジュール
  "strict": true,               // 厳格な型チェック
  "outDir": "./dist",           // ビルド出力先
  "sourceMap": true,            // デバッグ用ソースマップ
  "declaration": true           // 型定義ファイル生成
}
```

**ESLint ルール** (`.eslintrc.json`):
- TypeScript 推奨設定
- 明示的関数型注釈を推奨
- 未使用変数の禁止
- Prettier との統合

---

## 機能仕様

### 1. ニュース収集機能

#### 対応ソース一覧

| カテゴリ | ソース | 言語 | RSS URL |
|---------|--------|------|---------|
| **AI・LLM** | Google News (JP) | 日本語 | `https://news.google.com/rss/search?q=AI+OR+LLM+...` |
| **世界経済** | Google News (JP) | 日本語 | `https://news.google.com/rss/search?q=世界経済+OR+...` |
| **金融速報** | Google News (JP) | 日本語 | `https://news.google.com/rss/search?q=金融+OR+株式市場+...` |
| **Tech (Global)** | The Verge | 英語 | `https://www.theverge.com/rss/index.xml` |
| **Business (Reuters)** | Google News (US) | 英語 | `https://news.google.com/rss/search?q=site:reuters.com+...` |

#### 取得制限
- **カテゴリごと**: 最大 5 件
- **全体合計**: 最大 15 件（重複除外後）

### 2. 重要度判定機能

#### 判定アルゴリズム

**優先度**: High > Medium > Low

```typescript
// 重要度判定ロジック (src/index.ts:248-266)
function judgeImportance(title: string): ImportanceLevel {
  const lowerTitle = title.toLowerCase();

  // 高重要度: AI・半導体関連キーワード
  if (matchesKeywords(lowerTitle, HIGH_KEYWORDS)) {
    return 'high';  // 🔥🔥🔥
  }

  // 中重要度: 金融・経済政策関連キーワード
  if (matchesKeywords(lowerTitle, MEDIUM_KEYWORDS)) {
    return 'medium';  // 🔥🔥
  }

  return 'low';  // (ラベルなし)
}
```

#### 重要度キーワード

**高重要度** (High - 🔥🔥🔥):
- **AI/ML**: NVIDIA, エヌビディア, AI, 人工知能, ChatGPT, Claude, Gemini, LLM, GPT
- **半導体**: 半導体, GPU, chip, semiconductor, neural network
- **企業**: OpenAI, Anthropic, Google AI

**中重要度** (Medium - 🔥🔥):
- **金融**: 利上げ, 利下げ, 日銀, FRB, 株価, 為替, 金利, inflation
- **経済**: GDP, インフレ, stock market, economy, earnings

### 3. フィルタリング機能

#### 除外キーワード

**日本語**:
- 恋愛, ドラマ, 芸能, アイドル, バラエティ, 映画, 俳優, 女優
- デート, 結婚, 熱愛, 交際

**英語**:
- celebrity, dating, romance, entertainment

#### 処理フロー
```
RSS記事取得
    ↓
除外キーワードチェック (shouldExclude)
    ↓ (パス)
重複チェック (履歴との照合)
    ↓ (新規)
重要度判定 (judgeImportance)
    ↓
表示・保存
```

### 4. 重複排除機能

#### 履歴管理仕様

**データ構造** (`data/history.json`):
```json
{
  "titles": [
    "記事タイトル1",
    "記事タイトル2",
    "..."
  ],
  "lastUpdated": "2026-01-06T12:00:00.000Z"
}
```

**動作仕様**:
- 記事タイトルで重複判定（完全一致）
- 最大500件まで保持（古いものから自動削除）
- GitHub Actions Cache API に永続化
- ブランチごとに独立したキャッシュ

#### キャッシュキー戦略

```yaml
# 復元キー (restore-keys)
news-history-${github.ref_name}
news-history-

# 保存キー (save key)
news-history-${github.ref_name}-${github.run_id}
```

### 5. 表示機能

#### 出力フォーマット

```
╔════════════════════════════════════════════════════════════════╗
║        📰 News Curation Bot Pro - 最新ニュース                 ║
╚════════════════════════════════════════════════════════════════╝

📊 重要度順に 10 件の新着ニュースを表示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🔥🔥🔥 NVIDIAが次世代AI半導体を発表
        📁 AI・LLM | 🏢 ITmedia | 🕐 1月6日 08:30
        🔗 https://news.google.com/...

  🔥🔥 日銀が政策金利を据え置き
        📁 金融速報 | 🏢 日本経済新聞 | 🕐 1月6日 07:00
        🔗 https://news.google.com/...

────────────────────────────────────────────────────────────────
📈 統計: 取得 25 件 → 新着 10 件（重複除外済み）
────────────────────────────────────────────────────────────────
```

#### ソート順
1. **重要度優先**: High → Medium → Low
2. **同一重要度内**: 取得順（新しい記事が上に来る傾向）

---

## データモデル

### TypeScript型定義

#### 1. NewsItem（記事データ）

```typescript
interface NewsItem {
  title: string;           // クリーン済みタイトル（ソース名除去後）
  url: string;             // 記事URL
  publishedAt: string;     // 整形済み日時（例: "1月6日 08:30"）
  source: string;          // ソース名（例: "日本経済新聞", "Reuters"）
  importance: ImportanceLevel;  // 'high' | 'medium' | 'low'
  category: string;        // カテゴリ名（例: "AI・LLM"）
}
```

#### 2. FeedConfig（フィード設定）

```typescript
interface FeedConfig {
  category: string;        // 表示用カテゴリ名
  url: string;             // RSS フィードURL
  lang: 'ja' | 'en';       // 言語コード
}
```

#### 3. FetchResult（取得結果）

```typescript
interface FetchResult {
  success: boolean;        // 取得成功可否
  category: string;        // カテゴリ名
  items: NewsItem[];       // 取得した記事配列
  error?: string;          // エラーメッセージ（失敗時）
}
```

#### 4. HistoryData（履歴データ）

```typescript
interface HistoryData {
  titles: string[];        // 既読記事タイトル配列
  lastUpdated: string;     // 最終更新日時（ISO 8601形式）
}
```

---

## アルゴリズム詳細

### 1. メイン処理フロー

```typescript
async function main(): Promise<void> {
  // ステップ1: 履歴読み込み
  const history = loadHistory();  // data/history.json から復元

  // ステップ2: 全フィードから並列取得
  const results = await Promise.all(
    FEED_CONFIGS.map(fetchNews)
  );

  // ステップ3: 全記事をフラット化
  const allItems = results.flatMap(r => r.items);

  // ステップ4: 重複除外
  const newItems = filterDuplicates(allItems, history);

  // ステップ5: 最大件数制限
  const limitedItems = newItems.slice(0, MAX_TOTAL_ITEMS);

  // ステップ6: 重要度順ソート・表示
  displayNews(sortByImportance(limitedItems));

  // ステップ7: 履歴更新・保存
  addToHistory(limitedItems, history);
  saveHistory(history);
}
```

### 2. 並列処理戦略

**Promise.all()** を使用した高速並列取得:
```typescript
// 5つのRSSフィードを同時に取得（最速のものから順次処理）
const results = await Promise.all([
  fetchNews(config1),  // Google News JP - AI
  fetchNews(config2),  // Google News JP - 経済
  fetchNews(config3),  // Google News JP - 金融
  fetchNews(config4),  // The Verge
  fetchNews(config5),  // Reuters
]);
```

**効果**:
- 直列処理: 約5-10秒/フィード × 5 = 25-50秒
- 並列処理: 最遅フィード分のみ = 約5-10秒

### 3. エラーハンドリング

#### フィード取得失敗時の動作

```typescript
// 個別フィードの失敗は全体処理に影響しない
try {
  const feed = await parser.parseURL(config.url);
  return { success: true, items: [...] };
} catch (error) {
  console.log(`⚠️ [${category}] 取得エラー`);
  return { success: false, items: [], error: error.message };
}
```

**結果**: 1つのフィードが失敗しても他のニュースは正常に表示される

---

## 設定・カスタマイズ

### 定数設定（src/index.ts:59-179）

#### 変更可能なパラメータ

```typescript
// ---- 取得制限 ----
const MAX_ITEMS_PER_CATEGORY = 5;   // カテゴリごとの最大取得件数
const MAX_TOTAL_ITEMS = 15;          // 全体の最大表示件数

// ---- 履歴管理 ----
const MAX_HISTORY_ITEMS = 500;       // 履歴保持件数
const HISTORY_FILE = 'data/history.json';  // 履歴ファイルパス

// ---- フィード設定 ----
const FEED_CONFIGS: FeedConfig[] = [
  // ここにRSSフィードを追加・編集
];

// ---- 除外キーワード ----
const EXCLUDE_KEYWORDS: string[] = [
  // ノイズとして除外するキーワードを追加
];

// ---- 重要度判定キーワード ----
const IMPORTANCE_KEYWORDS: ImportanceKeywords = {
  high: [/* 高重要度キーワード */],
  medium: [/* 中重要度キーワード */]
};
```

### 新しいRSSフィードの追加方法

```typescript
// FEED_CONFIGS 配列に新しい設定を追加
{
  category: '仮想通貨',  // 表示名
  url: 'https://news.google.com/rss/search?q=Bitcoin+OR+crypto&hl=ja',
  lang: 'ja'
}
```

### 実行スケジュールの変更

`.github/workflows/daily-news.yml` の cron 設定を編集:

```yaml
schedule:
  # 毎日8時(JST) = 前日23時(UTC)
  - cron: '0 23 * * *'

  # 変更例: 毎日12時(JST) = 同日3時(UTC)
  # - cron: '0 3 * * *'
```

**注意**: GitHub Actions のスケジュール実行は最大15分程度遅延する可能性があります。

---

## デプロイメント

### 初回セットアップ

#### 1. リポジトリのフォーク/クローン

```bash
git clone https://github.com/imloveit0106-crypto/news-curation-bot.git
cd news-curation-bot
```

#### 2. 依存関係のインストール

```bash
npm ci
```

#### 3. ビルド確認

```bash
npm run build
# → dist/ フォルダに JavaScript が生成される
```

#### 4. ローカル実行テスト

```bash
npm run start
# または開発モード
npm run dev
```

### GitHub Actions の有効化

#### 必要な権限設定

1. **Settings** → **Actions** → **General**
2. **Workflow permissions** を「Read and write permissions」に設定
3. **Allow GitHub Actions to create and approve pull requests** を有効化（オプション）

#### Actions タブでの確認

- **CI Workflow**: Push/PR時に自動実行
- **Daily News Workflow**: 毎日8時(JST)に自動実行

### キャッシュの初期化

**必要な場合のみ**: 履歴をリセットしたい場合

```bash
# Actions タブ → Caches → 該当キャッシュを削除
# または CLI で削除
gh cache list
gh cache delete <cache-id>
```

---

## 運用・監視

### ログの確認方法

#### 1. GitHub Actions ログ

1. リポジトリの **Actions** タブを開く
2. **Daily News Curation** ワークフローを選択
3. 最新の実行をクリック
4. **fetch-news** ジョブを展開
5. **Fetch latest news** ステップを確認

#### 2. サマリーレポート

各実行の **Summary** タブに自動生成される概要:
- 実行時刻（JST）
- Pro Edition 機能一覧
- 統計情報

### 監視すべき指標

| 項目 | 正常値 | 異常時の対応 |
|------|--------|-------------|
| **ワークフロー成功率** | 100% | RSS フィードURLを確認 |
| **取得記事数** | 10-25件 | 0件の場合はソースの稼働確認 |
| **新着記事数** | 5-15件 | 常に0件の場合は履歴キャッシュを削除 |
| **実行時間** | 30-60秒 | 2分以上の場合はネットワーク調査 |

### トラブルシューティング

#### Q1. ニュースが0件しか表示されない

**原因**: 履歴キャッシュに全記事が既読として登録済み

**対処法**:
```bash
# キャッシュを削除して再実行
gh cache list
gh cache delete <cache-key>
```

#### Q2. 特定のフィードだけ取得エラーになる

**原因**: RSS フィードのURL変更またはサービス停止

**対処法**:
1. `src/index.ts` の `FEED_CONFIGS` を確認
2. URLをブラウザで開いてXMLが取得できるか確認
3. 必要に応じてURLを更新

#### Q3. ワークフローが実行されない

**原因**: GitHub Actions の権限不足またはリポジトリの設定

**対処法**:
1. Settings → Actions → General で権限を確認
2. `.github/workflows/*.yml` の構文エラーを確認

---

## 制約事項・前提条件

### 技術的制約

1. **RSS フィードの制約**
   - Google News RSS は最大100件程度しか配信されない
   - 一部サイトはRobots.txtで自動アクセスを制限している可能性あり

2. **GitHub Actions の制約**
   - 無料プランでは月2,000分までの実行時間制限
   - キャッシュは7日間アクセスがないと自動削除される
   - cron 実行は最大15分程度遅延する可能性あり

3. **言語処理の制約**
   - 重要度判定は単純なキーワードマッチング（自然言語理解なし）
   - タイトルのみで判定（本文は未取得）

### 前提条件

- Node.js 18.0.0 以上がインストール済み
- GitHub アカウントとリポジトリへのアクセス権限
- インターネット接続が可能な環境

---

## 今後の拡張性

### フェーズ2: 機能強化候補

#### 1. AI による自然言語理解

```typescript
// OpenAI API または Claude API を使用した高度な重要度判定
async function judgeImportanceWithAI(title: string, summary: string): Promise<ImportanceLevel> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    // Claude API を使用して記事の重要度を分析
  });
  return response.importance;
}
```

#### 2. 通知機能

- **Slack 連携**: 高重要度ニュースを即座に通知
- **Email 配信**: 日次レポートをメール送信
- **Discord Webhook**: コミュニティチャンネルに自動投稿

#### 3. データベース化

```typescript
// SQLite / PostgreSQL に記事を永続化
interface NewsDatabase {
  id: number;
  title: string;
  url: string;
  importance: ImportanceLevel;
  createdAt: Date;
  category: string;
}
```

#### 4. Web UI ダッシュボード

- **Next.js + Vercel** で静的サイト生成
- **過去記事の検索・フィルタリング**
- **カテゴリ別グラフ表示**
- **重要度トレンド分析**

#### 5. マルチチャンネル配信

```yaml
outputs:
  - type: console      # 現在の実装
  - type: slack        # Slack 投稿
  - type: json_file    # JSON ファイル出力
  - type: markdown     # Markdown レポート生成
```

### アーキテクチャ改善案

#### モジュール分割

```
src/
├── index.ts           # エントリーポイント
├── fetcher/
│   ├── rss.ts        # RSS 取得ロジック
│   └── types.ts      # 型定義
├── analyzer/
│   ├── importance.ts # 重要度判定
│   └── filter.ts     # フィルタリング
├── storage/
│   ├── history.ts    # 履歴管理
│   └── cache.ts      # キャッシュ操作
└── output/
    ├── console.ts    # コンソール出力
    └── formatter.ts  # フォーマッター
```

#### テストカバレッジ

```bash
# Jest を導入してユニットテスト追加
npm install --save-dev jest @types/jest ts-jest

# テストスイート
src/__tests__/
├── importance.test.ts   # 重要度判定のテスト
├── filter.test.ts       # フィルタリングのテスト
└── history.test.ts      # 履歴管理のテスト
```

---

## まとめ

### 現在の実装状況

✅ **完成している機能**:
- マルチソースRSS収集（日本語・英語対応）
- キーワードベース重要度判定システム
- 履歴管理による重複排除
- ノイズフィルタリング
- GitHub Actions による自動実行
- Pro Edition 機能（キャッシュ最適化、ソート機能）

✅ **運用状況**:
- 毎日 8:00 JST に自動実行
- CI/CD パイプライン統合済み
- 本番環境で安定稼働中

### 技術的ハイライト

- **TypeScript の型安全性**: すべてのデータに厳密な型定義
- **並列処理による高速化**: Promise.all() で複数フィード同時取得
- **エラー耐性**: 個別フィード失敗時も他のニュース配信継続
- **キャッシュ戦略**: GitHub Actions Cache による効率的な履歴管理
- **コード品質**: ESLint + Prettier による一貫したコードスタイル

---

**Document Version**: 1.0.0
**Author**: News Curation Bot Development Team
**License**: MIT
