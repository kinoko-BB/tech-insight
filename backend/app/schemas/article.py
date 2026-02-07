from datetime import datetime

from pydantic import BaseModel, Field


# --- 共通 ---

class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = []


class ErrorBody(BaseModel):
    error: ErrorResponse


# --- 記事入力 ---

class ArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    author: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    published_at: datetime | None = None


class ArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
    author: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    published_at: datetime | None = None


# --- 記事出力 ---

class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    author: str | None
    category: str | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ArticleListResponse(BaseModel):
    data: list[ArticleResponse]
    meta: PaginationMeta


# --- カテゴリ ---

class CategoryItem(BaseModel):
    name: str
    article_count: int


class CategoryListResponse(BaseModel):
    data: list[CategoryItem]
