"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import { articleCreateSchema, type ArticleCreateFormData } from "@/lib/validations";
import type { Article } from "@/types";

interface ArticleFormProps {
  article?: Article;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ArticleForm({
  article,
  onSuccess,
  onCancel,
}: ArticleFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!article;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ArticleCreateFormData>({
    resolver: zodResolver(articleCreateSchema),
    defaultValues: article
      ? {
          title: article.title,
          content: article.content,
          author: article.author ?? "",
          category: article.category ?? "",
          published_at: article.published_at
            ? new Date(article.published_at).toISOString().slice(0, 16)
            : "",
        }
      : {
          title: "",
          content: "",
          author: "",
          category: "",
          published_at: "",
        },
  });

  const mutation = useMutation({
    mutationFn: (data: ArticleCreateFormData) => {
      const payload = {
        ...data,
        author: data.author || undefined,
        category: data.category || undefined,
        published_at: data.published_at || undefined,
      };
      return isEditing
        ? articlesApi.update(article.id, payload)
        : articlesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onSuccess();
    },
  });

  const onSubmit = (data: ArticleCreateFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">
        {isEditing ? "記事を編集" : "新規記事作成"}
      </h2>

      <div>
        <label className="mb-1 block text-sm font-medium">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          {...register("title")}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="記事タイトル"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          本文 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("content")}
          rows={8}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="記事本文"
        />
        {errors.content && (
          <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">著者</label>
          <input
            {...register("author")}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
            placeholder="著者名"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">カテゴリ</label>
          <input
            {...register("category")}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
            placeholder="例: Frontend, Backend"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">公開日時</label>
        <input
          {...register("published_at")}
          type="datetime-local"
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500">
          保存に失敗しました: {mutation.error instanceof Error ? mutation.error.message : "もう一度お試しください。"}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting || mutation.isPending
            ? "保存中..."
            : isEditing
              ? "更新"
              : "作成"}
        </button>
      </div>
    </form>
  );
}
