import Parser from 'rss-parser';

/**
 * News Curation Bot
 * AI・世界経済・金融に関する最新ニュースを収集・表示するボット
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

/** 重要度キーワード設定 */
interface ImportanceKeywords {
  high: string[];
  medium: string[];
}

/** フォーマット済みメッセージ */
interface FormattedMessage {
  header: string;
  categories: FormattedCategory[];
  footer: string;
}

interface FormattedCategory {
  name: string;
  items: FormattedItem[];
}

interface FormattedItem {
  importance: ImportanceLevel;
  importanceLabel: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
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

/**
 * 重要度判定キーワード
 * ここにキーワードを追加・変更することで判定ルールをカスタマイズできます
 */
const IMPORTANCE_KEYWORDS: ImportanceKeywords = {
  // 高重要度：AI・半導体関連
  high: [
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
  ],
  // 中重要度：金融・経済政策関連
  medium: [
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
  ],
};

/** 取得する最大件数 */
const MAX_ITEMS_PER_CATEGORY = 4;
const MAX_TOTAL_ITEMS = 10;

// ============================================
// 重要度判定
// ============================================

/**
 * タイトルから重要度を判定
 */
function judgeImportance(title: string): ImportanceLevel {
  const upperTitle = title.toUpperCase();

  // 高重要度キーワードをチェック
  for (const keyword of IMPORTANCE_KEYWORDS.high) {
    if (upperTitle.includes(keyword.toUpperCase())) {
      return 'high';
    }
  }

  // 中重要度キーワードをチェック
  for (const keyword of IMPORTANCE_KEYWORDS.medium) {
    if (upperTitle.includes(keyword.toUpperCase())) {
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
      return '　　';
  }
}

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
// Formatter（出力整形）
// ============================================

/**
 * 取得結果をフォーマット済みメッセージに変換
 * LINE/Slack等への出力切り替えに対応するための共通フォーマット
 */
function formatResults(results: FetchResult[]): FormattedMessage {
  const categories: FormattedCategory[] = [];
  let totalCount = 0;

  for (const result of results) {
    if (!result.success || result.items.length === 0) continue;

    const formattedItems: FormattedItem[] = [];

    for (const item of result.items) {
      if (totalCount >= MAX_TOTAL_ITEMS) break;

      formattedItems.push({
        importance: item.importance,
        importanceLabel: getImportanceLabel(item.importance),
        title: item.title,
        source: item.source,
        publishedAt: item.publishedAt,
        url: item.url,
      });

      totalCount++;
    }

    if (formattedItems.length > 0) {
      categories.push({
        name: result.category,
        items: formattedItems,
      });
    }
  }

  return {
    header: '📰 News Curation Bot - 最新ニュース',
    categories,
    footer: `✅ 合計 ${totalCount} 件のニュースを取得しました`,
  };
}

/**
 * コンソール出力用フォーマッター
 */
function formatForConsole(message: FormattedMessage): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('╔════════════════════════════════════════════════════════════════╗');
  lines.push(`║           ${message.header}                  ║`);
  lines.push('╚════════════════════════════════════════════════════════════════╝');
  lines.push('');

  for (const category of message.categories) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`📌 ${category.name}`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const item of category.items) {
      lines.push('');
      lines.push(`  ${item.importanceLabel} ${item.title}`);
      lines.push(`     🏢 ${item.source} | 🕐 ${item.publishedAt}`);
      lines.push(`     🔗 ${item.url}`);
    }
    lines.push('');
  }

  lines.push('────────────────────────────────────────────────────────────────');
  lines.push(message.footer);
  lines.push('────────────────────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}

/**
 * LINE通知用フォーマッター（将来の拡張用）
 */
function formatForLine(message: FormattedMessage): string {
  const lines: string[] = [];

  lines.push(`【${message.header}】`);
  lines.push('');

  for (const category of message.categories) {
    lines.push(`■ ${category.name}`);

    for (const item of category.items) {
      const label = item.importance === 'high' ? '[重要] ' : '';
      lines.push(`${label}${item.title}`);
      lines.push(`${item.url}`);
      lines.push('');
    }
  }

  lines.push(message.footer);

  return lines.join('\n');
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
 * ニュースをコンソールに表示
 */
function displayNews(results: FetchResult[]): void {
  const message = formatResults(results);
  const output = formatForConsole(message);
  console.log(output);

  // LINE用フォーマットも出力（デバッグ用、必要に応じてコメントアウト）
  // console.log('--- LINE Format ---');
  // console.log(formatForLine(message));
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

// エクスポート（将来のモジュール利用のため）
export {
  NewsItem,
  ImportanceLevel,
  FormattedMessage,
  formatResults,
  formatForConsole,
  formatForLine,
  judgeImportance,
  IMPORTANCE_KEYWORDS,
};
