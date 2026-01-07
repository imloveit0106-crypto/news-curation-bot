import { getNewsData, getCategories } from '@/lib/news-data';
import { NewsCard } from '@/components/news-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const newsData = getNewsData();
  const categories = getCategories(newsData);

  // 全カテゴリ用のタブを追加
  const allCategories = ['all', ...categories];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ヘッダー */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl">📰</div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                News Dashboard
              </h1>
              <p className="text-sm text-slate-400">
                AI・世界経済・金融の最新ニュース
              </p>
            </div>
          </div>
          {newsData.updatedAt && (
            <p className="text-xs text-slate-500 mt-2">
              最終更新: {new Date(newsData.updatedAt).toLocaleString('ja-JP')}
            </p>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8">
        {newsData.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-2">
              ニュースがありません
            </h2>
            <p className="text-slate-500">
              ニュースキュレーションBotを実行してデータを生成してください
            </p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6 bg-slate-900/50 border border-slate-800">
              {allCategories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100"
                >
                  {category === 'all' ? '🌐 すべて' : category}
                </TabsTrigger>
              ))}
            </TabsList>

            {allCategories.map((category) => {
              const filteredItems = category === 'all'
                ? newsData.items
                : newsData.items.filter(item => item.category === category);

              return (
                <TabsContent key={category} value={category}>
                  <div className="mb-4 text-slate-400">
                    {filteredItems.length} 件のニュース
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => (
                      <NewsCard key={item.id} item={item} />
                    ))}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>

      {/* フッター */}
      <footer className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          <p>Powered by News Curation Bot</p>
        </div>
      </footer>
    </main>
  );
}
