import Parser from 'rss-parser';

/**
 * News Curation Bot
 * AI・世界経済・金融に関する最新ニュースを収集・表示するボット
 */

// ============================================
// 型定義
// ============================================

/** ニュース記事の型 */
interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}

/** カテゴリ別のRSSフィード設定 */
interface FeedConfig {
  category: string;
  url: string;
}

/** RSS取得結果の型 */
interface FetchResult {
  success: boolean;
  category: string;
  items: NewsItem[];
  error?: string;
}

// ============================================
// 設定
// ============================================

/** 収集対象のRSSフィード一覧 */
const FEED_CONFIGS: FeedConfig[] = [
  {
    category: 'AI・LLM',
    url: 'https://news.google.com/rss/search?q=AI+OR+LLM+OR+OpenAI+OR+NVIDIA+OR+ChatGPT+OR+Claude&hl=ja&gl=JP&ceid=JP:ja',
  },
  {
    category: '世界経済',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('世界経済 OR グローバル経済 OR GDP')}&hl=ja&gl=JP&ceid=JP:ja`,
  },
  {
    category: '金融速報',
    url: `https://news.google.com/rss/search?q=${encodeURIComponent('金融 OR 株式市場 OR 為替 OR 日銀')}&hl=ja&gl=JP&ceid=JP:ja`,
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
];

/** 取得する最大件数 */
const MAX_ITEMS_PER_CATEGORY = 4;
const MAX_TOTAL_ITEMS = 10;

// ============================================
// ユーティリティ関数
// ============================================

/**
 * 除外キーワードを含むかチェック
 */
function shouldExclude(title: string): boolean {
  return EXCLUDE_KEYWORDS.some((keyword) => title.includes(keyword));
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
      .map((item) => ({
        title: cleanTitle(item.title || ''),
        url: item.link || '',
        publishedAt: formatDate(item.pubDate),
        source: extractSource(item.title || ''),
      }));

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
 * ニュースをコンソールに整形表示
 */
function displayNews(results: FetchResult[]): void {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           📰 News Curation Bot - 最新ニュース                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  let totalCount = 0;

  for (const result of results) {
    if (!result.success) {
      console.log(`⚠️  [${result.category}] 取得エラー: ${result.error}`);
      console.log('');
      continue;
    }

    if (result.items.length === 0) {
      console.log(`📭 [${result.category}] ニュースが見つかりませんでした`);
      console.log('');
      continue;
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📌 ${result.category}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    for (const item of result.items) {
      if (totalCount >= MAX_TOTAL_ITEMS) break;

      console.log('');
      console.log(`  📄 ${item.title}`);
      console.log(`     🏢 ${item.source} | 🕐 ${item.publishedAt}`);
      console.log(`     🔗 ${item.url}`);

      totalCount++;
    }
    console.log('');
  }

  console.log('────────────────────────────────────────────────────────────────');
  console.log(`✅ 合計 ${totalCount} 件のニュースを取得しました`);
  console.log('────────────────────────────────────────────────────────────────');
  console.log('');
}

/**
 * メイン関数
 */
async function main(): Promise<void> {
  console.log('🚀 News Curation Bot を起動しています...');
  console.log('📡 ニュースを取得中...');

  const results = await Promise.all(FEED_CONFIGS.map(fetchNews));

  displayNews(results);
}

// 実行
main().catch((error: unknown) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
