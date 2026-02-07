from fastapi import APIRouter, Depends

from app.dependencies import get_article_service
from app.schemas.article import CategoryListResponse
from app.services.article_service import ArticleService

router = APIRouter()


@router.get("/categories", response_model=CategoryListResponse)
async def list_categories(
    service: ArticleService = Depends(get_article_service),
) -> CategoryListResponse:
    categories = await service.list_categories()
    return CategoryListResponse(data=categories)
