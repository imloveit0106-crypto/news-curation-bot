import fs from 'fs';
import path from 'path';
import { NewsData } from './types';

/**
 * docs/news.json からニュースデータを読み込む
 * ファイルが存在しない場合は空のデータを返す
 */
export function getNewsData(): NewsData {
    try {
        const filePath = path.join(process.cwd(), '..', 'docs', 'news.json');

        if (!fs.existsSync(filePath)) {
            console.warn('news.json not found, returning empty data');
            return {
                updatedAt: new Date().toISOString(),
                items: [],
            };
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data: NewsData = JSON.parse(fileContent);

        return data;
    } catch (error) {
        console.error('Error reading news data:', error);
        return {
            updatedAt: new Date().toISOString(),
            items: [],
        };
    }
}

/**
 * カテゴリの一覧を取得
 */
export function getCategories(data: NewsData): string[] {
    const categories = new Set<string>();
    data.items.forEach(item => categories.add(item.category));
    return Array.from(categories);
}

/**
 * カテゴリでフィルタリング
 */
export function filterByCategory(data: NewsData, category: string | null): NewsData {
    if (!category || category === 'all') {
        return data;
    }

    return {
        ...data,
        items: data.items.filter(item => item.category === category),
    };
}
