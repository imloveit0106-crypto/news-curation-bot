import { NewsItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface NewsCardProps {
    item: NewsItem;
}

export function NewsCard({ item }: NewsCardProps) {
    const getImportanceBadge = (importance: NewsItem['importance']) => {
        switch (importance) {
            case 'high':
                return (
                    <Badge variant="destructive" className="gap-1">
                        🔥 Hot
                    </Badge>
                );
            case 'medium':
                return (
                    <Badge variant="secondary" className="gap-1">
                        ⚡ Important
                    </Badge>
                );
            case 'low':
                return (
                    <Badge variant="outline">
                        📰 News
                    </Badge>
                );
        }
    };

    const getBorderColor = (importance: NewsItem['importance']) => {
        switch (importance) {
            case 'high':
                return 'border-red-500 border-2';
            case 'medium':
                return 'border-yellow-500';
            case 'low':
                return 'border-slate-700';
        }
    };

    return (
        <Card className={`hover:shadow-lg transition-all duration-300 ${getBorderColor(item.importance)} bg-slate-900/50 backdrop-blur`}>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-bold text-slate-100 line-clamp-2">
                        {item.title}
                    </CardTitle>
                    {getImportanceBadge(item.importance)}
                </div>
                <CardDescription className="flex flex-wrap gap-2 text-slate-400">
                    <span className="flex items-center gap-1">
                        📁 {item.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        🏢 {item.source}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        🕐 {item.publishedAt}
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                    記事を読む
                    <ExternalLink className="w-4 h-4" />
                </a>
            </CardContent>
        </Card>
    );
}
