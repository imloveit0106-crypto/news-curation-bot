'use client';

import { useState } from 'react';
import { summarizeArticle } from '@/app/actions/summary';

interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

interface NewsCardProps {
  item: NewsItem;
}

export default function NewsCard({ item }: NewsCardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    const result = await summarizeArticle(item.title, item.url);

    if (result.success) {
      setSummary(result.summary || '');
    } else {
      setError(result.error || '要約に失敗しました');
    }

    setLoading(false);
  };

  const getImportanceBadge = () => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };

    const labels = {
      high: '高',
      medium: '中',
      low: '低',
    };

    return (
      <span className={`importance-badge ${colors[item.importance]}`}>
        {labels[item.importance]}
      </span>
    );
  };

  return (
    <div className="news-card">
      <div className="news-card-header">
        {getImportanceBadge()}
        <span className="category">{item.category}</span>
      </div>

      <h2 className="news-title">
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h2>

      <div className="news-meta">
        <span className="source">{item.source}</span>
        <span className="date">{item.publishedAt}</span>
      </div>

      <div className="news-actions">
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="summarize-button"
        >
          {loading ? '要約中...' : '要約する'}
        </button>
      </div>

      {summary && (
        <div className="summary-container">
          <h3>AI要約:</h3>
          <div className="summary-content">{summary}</div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}

      <style jsx>{`
        .news-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .news-card-header {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          align-items: center;
        }

        .importance-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .category {
          color: #666;
          font-size: 0.875rem;
        }

        .news-title {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .news-title a {
          color: #222;
          text-decoration: none;
        }

        .news-title a:hover {
          color: #0066cc;
          text-decoration: underline;
        }

        .news-meta {
          display: flex;
          gap: 1rem;
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .news-actions {
          margin-top: 1rem;
        }

        .summarize-button {
          background-color: #0066cc;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }

        .summarize-button:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .summarize-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .summary-container {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 4px;
          border-left: 4px solid #0066cc;
        }

        .summary-container h3 {
          font-size: 0.875rem;
          color: #0066cc;
          margin-bottom: 0.5rem;
        }

        .summary-content {
          color: #333;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .error-container {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #fff3cd;
          border-radius: 4px;
          border-left: 4px solid #ffc107;
        }

        .error-container p {
          color: #856404;
          margin: 0;
        }

        .bg-red-100 {
          background-color: #fee2e2;
        }
        .text-red-800 {
          color: #991b1b;
        }
        .bg-yellow-100 {
          background-color: #fef3c7;
        }
        .text-yellow-800 {
          color: #92400e;
        }
        .bg-green-100 {
          background-color: #dcfce7;
        }
        .text-green-800 {
          color: #166534;
        }
      `}</style>
    </div>
  );
}
