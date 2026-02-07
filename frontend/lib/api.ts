import type {
  ArticleListResponse,
  ArticleDetailResponse,
  ArticleCreateInput,
  ArticleUpdateInput,
  CategoryListResponse,
} from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public details: string
  ) {
    super(`API error ${status}: ${details || statusText}`);
  }
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, res.statusText, body);
  }

  return res.json();
}

async function fetchApiVoid(
  path: string,
  options?: RequestInit
): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, res.statusText, body);
  }
}

export const articlesApi = {
  list(params?: {
    page?: number;
    per_page?: number;
    category?: string;
    sort_by?: string;
    sort_order?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    if (params?.category) query.set("category", params.category);
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.sort_order) query.set("sort_order", params.sort_order);
    const qs = query.toString();
    return fetchApi<ArticleListResponse>(`/articles${qs ? `?${qs}` : ""}`);
  },

  get(id: number) {
    return fetchApi<ArticleDetailResponse>(`/articles/${id}`);
  },

  create(data: ArticleCreateInput) {
    return fetchApi<ArticleDetailResponse>("/articles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: ArticleUpdateInput) {
    return fetchApi<ArticleDetailResponse>(`/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number) {
    return fetchApiVoid(`/articles/${id}`, { method: "DELETE" });
  },
};

export const categoriesApi = {
  list() {
    return fetchApi<CategoryListResponse>("/categories");
  },
};
