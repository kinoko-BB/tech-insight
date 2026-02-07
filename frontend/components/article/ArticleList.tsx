"use client";

import { useQuery } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import type { Article } from "@/types";
import ArticleCard from "./ArticleCard";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ArticleListProps {
  selectedCategory: string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectArticle: (article: Article) => void;
}

export default function ArticleList({
  selectedCategory,
  currentPage,
  onPageChange,
  onSelectArticle,
}: ArticleListProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", { page: currentPage, category: selectedCategory }],
    queryFn: () =>
      articlesApi.list({
        page: currentPage,
        per_page: 9,
        category: selectedCategory ?? undefined,
      }),
  });

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="py-12 text-center text-zinc-500">
        記事の読み込みに失敗しました。バックエンドサーバーが起動しているか確認してください。
      </div>
    );
  }

  const articles = data?.data ?? [];
  const meta = data?.meta;

  if (articles.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500">
        記事が見つかりません。
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onSelect={onSelectArticle}
          />
        ))}
      </div>
      {meta && (
        <div className="mt-8">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.total_pages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
