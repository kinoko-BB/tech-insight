from typing import Literal

from fastapi import APIRouter, Depends, Query, Response

from app.dependencies import get_article_service
from app.schemas.article import (
    ArticleCreate,
    ArticleListResponse,
    ArticleResponse,
    ArticleUpdate,
)
from app.services.article_service import ArticleService

router = APIRouter()


@router.get("/articles", response_model=ArticleListResponse)
async def list_articles(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    sort: str = Query("created_at"),
    order: Literal["asc", "desc"] = Query("desc"),
    service: ArticleService = Depends(get_article_service),
) -> ArticleListResponse:
    articles, meta = await service.list_articles(
        page=page,
        per_page=per_page,
        category=category,
        sort=sort,
        order=order,
    )
    return ArticleListResponse(
        data=[ArticleResponse.model_validate(a) for a in articles],
        meta=meta,
    )


@router.post("/articles", response_model=dict, status_code=201)
async def create_article(
    data: ArticleCreate,
    service: ArticleService = Depends(get_article_service),
) -> dict:
    article = await service.create_article(data)
    return {"data": ArticleResponse.model_validate(article)}


@router.get("/articles/{article_id}", response_model=dict)
async def get_article(
    article_id: int,
    service: ArticleService = Depends(get_article_service),
) -> dict:
    article = await service.get_article(article_id)
    return {"data": ArticleResponse.model_validate(article)}


@router.put("/articles/{article_id}", response_model=dict)
async def update_article(
    article_id: int,
    data: ArticleUpdate,
    service: ArticleService = Depends(get_article_service),
) -> dict:
    article = await service.update_article(article_id, data)
    return {"data": ArticleResponse.model_validate(article)}


@router.delete("/articles/{article_id}", status_code=204)
async def delete_article(
    article_id: int,
    service: ArticleService = Depends(get_article_service),
) -> Response:
    await service.delete_article(article_id)
    return Response(status_code=204)
