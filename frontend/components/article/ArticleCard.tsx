"use client";

import type { Article } from "@/types";

interface ArticleCardProps {
  article: Article;
  onSelect: (article: Article) => void;
}

export default function ArticleCard({ article, onSelect }: ArticleCardProps) {
  const preview =
    article.content.length > 150
      ? article.content.slice(0, 150) + "..."
      : article.content;

  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("ja-JP")
    : new Date(article.created_at).toLocaleDateString("ja-JP");

  return (
    <button
      onClick={() => onSelect(article)}
      aria-label={`記事「${article.title}」を読む`}
      className="w-full rounded-lg border border-zinc-200 p-5 text-left transition-shadow hover:shadow-md dark:border-zinc-700"
    >
      <div className="mb-2 flex items-center gap-2">
        {article.category && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {article.category}
          </span>
        )}
        <span className="text-xs text-zinc-500">{date}</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold">{article.title}</h3>
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        {preview}
      </p>
      {article.author && (
        <p className="text-xs text-zinc-500">by {article.author}</p>
      )}
    </button>
  );
}
