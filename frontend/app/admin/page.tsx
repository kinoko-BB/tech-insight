"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import type { Article } from "@/types";
import Modal from "@/components/ui/Modal";
import ArticleForm from "@/components/article/ArticleForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", { page: currentPage }],
    queryFn: () => articlesApi.list({ page: currentPage, per_page: 20 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => articlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setEditingArticle(undefined);
    setFormOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingArticle(undefined);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">
            <Link href="/">TechInsight</Link>
            <span className="ml-2 text-base font-normal text-zinc-500">
              Admin
            </span>
          </h1>
          <Link
            href="/"
            className="rounded px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            サイトへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">記事管理</h2>
          <button
            onClick={openCreate}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            新規作成
          </button>
        </div>

        {isLoading && <LoadingSpinner />}

        {isError && (
          <div className="py-12 text-center text-zinc-500">
            記事の読み込みに失敗しました。
          </div>
        )}

        {data && (
          <>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">タイトル</th>
                    <th className="px-4 py-3 font-medium">カテゴリ</th>
                    <th className="px-4 py-3 font-medium">著者</th>
                    <th className="px-4 py-3 font-medium">作成日</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((article) => (
                    <tr
                      key={article.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3 text-zinc-500">{article.id}</td>
                      <td className="px-4 py-3 font-medium">
                        {article.title}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {article.category ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {article.author ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(article.created_at).toLocaleDateString(
                          "ja-JP"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(article)}
                            className="rounded px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => setDeleteTarget(article)}
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.meta && (
              <div className="mt-6">
                <Pagination
                  currentPage={data.meta.page}
                  totalPages={data.meta.total_pages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* 記事作成/編集モーダル */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)}>
        <ArticleForm
          article={editingArticle}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      >
        <div className="pr-8">
          <h2 className="mb-4 text-lg font-bold">記事を削除</h2>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            「{deleteTarget?.title}」を削除してよろしいですか？この操作は取り消せません。
          </p>
          {deleteMutation.isError && (
            <p className="mb-4 text-sm text-red-500">
              削除に失敗しました: {deleteMutation.error instanceof Error ? deleteMutation.error.message : "もう一度お試しください。"}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              キャンセル
            </button>
            <button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "削除中..." : "削除する"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
