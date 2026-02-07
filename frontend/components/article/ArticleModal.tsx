"use client";

import type { Article } from "@/types";
import Modal from "@/components/ui/Modal";

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
}

export default function ArticleModal({ article, onClose }: ArticleModalProps) {
  return (
    <Modal isOpen={article !== null} onClose={onClose}>
      {article && (
        <article className="pr-8">
          <div className="mb-4 flex items-center gap-3">
            {article.category && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {article.category}
              </span>
            )}
            <span className="text-sm text-zinc-400">
              {article.published_at
                ? new Date(article.published_at).toLocaleDateString("ja-JP")
                : new Date(article.created_at).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <h2 className="mb-4 text-2xl font-bold">{article.title}</h2>
          {article.author && (
            <p className="mb-6 text-sm text-zinc-500">by {article.author}</p>
          )}
          <div className="whitespace-pre-wrap text-zinc-700 leading-relaxed dark:text-zinc-300">
            {article.content}
          </div>
        </article>
      )}
    </Modal>
  );
}
