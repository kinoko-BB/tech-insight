"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Article } from "@/types";
import CategoryFilter from "@/components/category/CategoryFilter";
import ArticleList from "@/components/article/ArticleList";
import ArticleModal from "@/components/article/ArticleModal";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCategory = searchParams.get("category");
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelect={handleCategoryChange}
          />
        </div>

        <ArticleList
          selectedCategory={selectedCategory}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSelectArticle={setSelectedArticle}
        />
      </main>

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">TechInsight</h1>
          <Link
            href="/admin"
            className="rounded px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Admin
          </Link>
        </div>
      </header>

      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </div>
  );
}
