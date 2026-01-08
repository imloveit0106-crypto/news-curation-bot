import { promises as fs } from 'fs';
import path from 'path';
import NewsCard from '@/components/news-card';

interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

async function getNews(): Promise<NewsItem[]> {
  try {
    const newsFilePath = path.join(process.cwd(), '..', 'docs', 'news.json');
    const fileContents = await fs.readFile(newsFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('ニュースの読み込みに失敗しました:', error);
    return [];
  }
}

export default async function Home() {
  const news = await getNews();

  return (
    <main>
      <h1>📰 News Curation Bot</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        AI・技術系ニュースキュレーション
      </p>

      {news.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'white',
            borderRadius: '8px',
          }}
        >
          <p>ニュースがまだ収集されていません。</p>
          <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
            バックエンドで <code>npm run start</code> を実行してニュースを収集してください。
          </p>
        </div>
      ) : (
        <div>
          {news.map((item, index) => (
            <NewsCard key={index} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
