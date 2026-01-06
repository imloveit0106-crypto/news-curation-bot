import Parser from 'rss-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * News Curation Bot - Pro Edition
 * AI・世界経済・金融に関する最新ニュースを収集・重要度判定・重複排除するボット
 */

// ============================================
// 型定義
// ============================================

/** 重要度レベル */
type ImportanceLevel = 'high' | 'medium' | 'low';

/** ニュース記事の型 */
interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  importance: ImportanceLevel;
  category: string;
}

/** カテゴリ別のRSSフィード設定 */
interface FeedConfig {
  category: string;
  url: string;
  lang: 'ja' | 'en';
}

/** RSS取得結果の型 */
interface FetchResult {
  success: boolean;
  category: string;
  items: NewsItem[];
  error?: string;
}

/** 重要度キーワード設定 */
interface ImportanceKeywords {
  high: string[];
  medium: string[];
}

/** 履歴データの型 */
interface HistoryData {
  titles: string[];
  lastUpdated: string;
}

/** 出力用のニュースアイテム型 */
interface NewsOutputItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  importance: ImportanceLevel;
  category: string;
}

/** 出力用のニュースデータ型 */
interface NewsData {
  updatedAt: string;
  items: NewsOutputItem[];
}

// ============================================
// 設定
// ============================================

/** 履歴ファイルのパス */
const HISTORY_FILE = path.join(process.cwd(), 'data', 'history.json');

/** 出力ファイルのパス */
const OUTPUT_FILE = path.join(process.cwd(), 'docs', 'news.json');

/** 履歴の保持件数（古いものから削除） */
const MAX_HISTORY_ITEMS = 500;

/** 収集対象のRSSフィード一覧 */
const FEED_CONFIGS: FeedConfig[] = [
  // 日本語ソース
  {
    category: 'AI・LLM',
    url: 'https://news.google.com/rss/search?q=AI+OR+LLM+OR+OpenAI+OR+NVIDIA+OR+ChatGPT+OR+Claude&hl=ja&gl=JP&ceid=JP:ja',
    lang: 'ja',
  },
  {
    category: '世界経済',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('世界経済 OR グローバル経済 OR GDP')}&hl=ja&gl=JP&ceid=JP:ja`,
    lang: 'ja',
  },
  {
    category: '金融速報',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('金融 OR 株式市場 OR 為替 OR 日銀')}&hl=ja&gl=JP&ceid=JP:ja`,
    lang: 'ja',
  },
  // 海外ソース（英語）
  {
    category: 'Tech (Global)',
    url: 'https://www.theverge.com/rss/index.xml',
    lang: 'en',
  },
  {
    category: 'Business (white Reuters)',
    url: 'https://news.google.com/rss/search?q=site:reuters.com+AI+OR+NVIDIA+OR+semiconductor&hl=en-US&gl=US&ceid=US:en',
    lang: 'en',
  },
];

/** 除外キーワード（恋愛・エンタメ系を除外） */
const EXCLUDE_KEYWORDS: string[] = [
  '恋愛',
  'ドラマ',
  '芸能',
  'アイドル',
  'バラエティ',
  '映画',
  '俳優',
  '女優',
  'デート',
  '結婚',
  '熱愛',
  '交際',
  // 英語の除外キーワード
  'celebrity',
  'dating',
  'romance',
  'entertainment',
];

/**
 * 重要度判定キーワード（日本語 + 英語）
 * ここにキーワードを追加・変更することで判定ルールをカスタマイズできます
 */
const IMPORTANCE_KEYWORDS: ImportanceKeywords = {
  // 高重要度：AI・半導体関連
  high: [
    // 日本語
    'NVIDIA',
    'エヌビディア',
    'AI',
    '人工知能',
    '半導体',
    'GPU',
    'OpenAI',
    'ChatGPT',
    'Claude',
    'Anthropic',
    'Google AI',
    'Gemini',
    'LLM',
    '大規模言語モデル',
    // 英語
    'artificial intelligence',
    'semiconductor',
    'chip',
    'neural network',
    'machine learning',
    'deep learning',
    'GPT',
    'transformer',
  ],
  // 中重要度：金融・経済政策関連
  medium: [
    // 日本語
    '利上げ',
    '利下げ',
    '日銀',
    '日本銀行',
    'FRB',
    '株価',
    '株式',
    '為替',
    '円安',
    '円高',
    'ドル',
    '金利',
    'インフレ',
    'GDP',
    // 英語
    'interest rate',
    'federal reserve',
    'stock market',
    'inflation',
    'economy',
    'earnings',
    'investment',
    'market cap',
  ],
};

/** 取得する最大件数 */
const MAX_ITEMS_PER_CATEGORY = 5;
const MAX_TOTAL_ITEMS = 15;

// ============================================
// 履歴管理（重複排除）
// ============================================

/**
 * 履歴ファイルを読み込む
 */
function loadHistory(): Set<string> {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const history: HistoryData = JSON.parse(data) as HistoryData;
      return new Set(history.titles);
    }
  } catch (error) {
    console.log('📝 履歴ファイルを新規作成します');
  }
  return new Set();
}

/**
 * 履歴ファイルを保存する
 */
function saveHistory(titles: Set<string>): void {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 古い履歴を削除（最新のMAX_HISTORY_ITEMS件のみ保持）
    const titlesArray = Array.from(titles).slice(-MAX_HISTORY_ITEMS);

    const history: HistoryData = {
      titles: titlesArray,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('⚠️ 履歴の保存に失敗しました:', error);
  }
}

/**
 * 重複をフィルタリングし、新しい記事のみ返す
 */
function filterDuplicates(items: NewsItem[], history: Set<string>): NewsItem[] {
  return items.filter((item) => !history.has(item.title));
}

/**
 * 履歴に新しいタイトルを追加
 */
function addToHistory(items: NewsItem[], history: Set<string>): void {
  for (const item of items) {
    history.add(item.title);
  }
}

// ============================================
// ファイル出力
// ============================================

/**
 * URLからIDを生成（SHA-256ハッシュの先頭16文字）
 */
function generateIdFromUrl(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
}

/**
 * NewsItemをNewsOutputItemに変換
 */
function toOutputItem(item: NewsItem): NewsOutputItem {
  return {
    id: generateIdFromUrl(item.url),
    title: item.title,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
    importance: item.importance,
    category: item.category,
  };
}

/**
 * ニュースをJSONファイルに保存
 */
function saveNewsToJson(items: NewsItem[]): void {
  try {
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('📁 docs ディレクトリを作成しました');
    }

    const newsData: NewsData = {
      updatedAt: new Date().toISOString(),
      items: items.map(toOutputItem),
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(newsData, null, 2), 'utf-8');
    console.log(`📄 ニュースを ${OUTPUT_FILE} に保存しました`);
  } catch (error) {
    console.error('⚠️ ニュースの保存に失敗しました:', error);
  }
}

// ============================================
// 重要度判定
// ============================================

/**
 * タイトルから重要度を判定（大文字小文字を区別しない）
 */
function judgeImportance(title: string): ImportanceLevel {
  const lowerTitle = title.toLowerCase();

  // 高重要度キーワードをチェック
  for (const keyword of IMPORTANCE_KEYWORDS.high) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      return 'high';
    }
  }

  // 中重要度キーワードをチェック
  for (const keyword of IMPORTANCE_KEYWORDS.medium) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      return 'medium';
    }
  }

  return 'low';
}

/**
 * 重要度に応じたラベルを取得
 */
function getImportanceLabel(importance: ImportanceLevel): string {
  switch (importance) {
    case 'high':
      return '🔥🔥🔥';
    case 'medium':
      return '🔥🔥';
    case 'low':
      return '     ';
  }
}

/**
 * 重要度の数値変換（ソート用）
 */
function importanceToNumber(importance: ImportanceLevel): number {
  switch (importance) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

// ============================================
// ユーティリティ関数
// ============================================

/**
 * 除外キーワードを含むかチェック
 */
function shouldExclude(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return EXCLUDE_KEYWORDS.some((keyword) => lowerTitle.includes(keyword.toLowerCase()));
}

/**
 * 日付を整形
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '不明';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '不明';
  }
}

/**
 * ソース名を抽出（タイトルから「- ソース名」部分を取得）
 */
function extractSource(title: string): string {
  const match = title.match(/ - ([^-]+)$/);
  return match ? match[1].trim() : '不明';
}

/**
 * タイトルからソース部分を除去
 */
function cleanTitle(title: string): string {
  return title.replace(/ - [^-]+$/, '').trim();
}

// ============================================
// メイン処理
// ============================================

/**
 * RSSフィードからニュースを取得
 */
async function fetchNews(config: FeedConfig): Promise<FetchResult> {
  const parser = new Parser();

  try {
    const feed = await parser.parseURL(config.url);

    const items: NewsItem[] = feed.items
      .filter((item) => item.title && !shouldExclude(item.title))
      .slice(0, MAX_ITEMS_PER_CATEGORY)
      .map((item) => {
        const title = cleanTitle(item.title || '');
        return {
          title,
          url: item.link || '',
          publishedAt: formatDate(item.pubDate),
          source: extractSource(item.title || ''),
          importance: judgeImportance(title),
          category: config.category,
        };
      });

    return {
      success: true,
      category: config.category,
      items,
    };
  } catch (error) {
    return {
      success: false,
      category: config.category,
      items: [],
      error: error instanceof Error ? error.message : '不明なエラー',
    };
  }
}

/**
 * ニュースを重要度順にソート
 */
function sortByImportance(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const diff = importanceToNumber(b.importance) - importanceToNumber(a.importance);
    if (diff !== 0) return diff;
    // 同じ重要度なら日付順（新しい順）
    return 0;
  });
}

/**
 * ニュースをコンソールに整形表示
 */
function displayNews(items: NewsItem[], newCount: number, totalFetched: number): void {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        📰 News Curation Bot Pro - 最新ニュース                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  if (items.length === 0) {
    console.log('📭 新着ニュースはありません（すべて既読）');
    console.log('');
  } else {
    // 重要度順にソート
    const sortedItems = sortByImportance(items);

    console.log(`📊 重要度順に ${sortedItems.length} 件の新着ニュースを表示`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    for (const item of sortedItems) {
      const label = getImportanceLabel(item.importance);
      console.log(`  ${label} ${item.title}`);
      console.log(`        📁 ${item.category} | 🏢 ${item.source} | 🕐 ${item.publishedAt}`);
      console.log(`        🔗 ${item.url}`);
      console.log('');
    }
  }

  console.log('────────────────────────────────────────────────────────────────');
  console.log(`📈 統計: 取得 ${totalFetched} 件 → 新着 ${newCount} 件（重複除外済み）`);
  console.log('────────────────────────────────────────────────────────────────');
  console.log('');
}

/**
 * メイン関数
 */
async function main(): Promise<void> {
  console.log('🚀 News Curation Bot Pro を起動しています...');
  console.log('📡 ニュースを取得中...');

  // 履歴を読み込む
  const history = loadHistory();
  console.log(`📚 履歴: ${history.size} 件の既読記事`);

  // 全フィードから取得
  const results = await Promise.all(FEED_CONFIGS.map(fetchNews));

  // 全アイテムをフラットにまとめる
  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.success) {
      allItems.push(...result.items);
    } else {
      console.log(`⚠️  [${result.category}] 取得エラー: ${result.error}`);
    }
  }

  const totalFetched = allItems.length;

  // 重複を除外
  const newItems = filterDuplicates(allItems, history);

  // 最大件数に制限
  const limitedItems = newItems.slice(0, MAX_TOTAL_ITEMS);

  // 重要度順にソート
  const sortedItems = sortByImportance(limitedItems);

  // 表示
  displayNews(sortedItems, sortedItems.length, totalFetched);

  // JSONファイルに保存
  saveNewsToJson(sortedItems);

  // 履歴を更新・保存
  addToHistory(limitedItems, history);
  saveHistory(history);

  console.log('💾 履歴を保存しました');
}

// 実行
main().catch((error: unknown) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
