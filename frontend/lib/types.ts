export type ImportanceLevel = 'high' | 'medium' | 'low';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  importance: ImportanceLevel;
  category: string;
}

export interface NewsData {
  updatedAt: string;
  items: NewsItem[];
}
