export interface Article {
  id: number;
  title: string;
  content: string;
  author: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ArticleListResponse {
  data: Article[];
  meta: PaginationMeta;
}

export interface ArticleDetailResponse {
  data: Article;
}

export interface CategoryItem {
  name: string;
  article_count: number;
}

export interface CategoryListResponse {
  data: CategoryItem[];
}

export interface ArticleCreateInput {
  title: string;
  content: string;
  author?: string;
  category?: string;
  published_at?: string;
}

export type ArticleUpdateInput = Partial<ArticleCreateInput>;
