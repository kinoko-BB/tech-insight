import math

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models.article import Article
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    CategoryItem,
    PaginationMeta,
)


class ArticleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_article(self, article_id: int) -> Article:
        stmt = select(Article).where(Article.id == article_id)
        result = await self.db.execute(stmt)
        article = result.scalar_one_or_none()
        if article is None:
            raise NotFoundError(f"Article with id {article_id} not found")
        return article

    async def list_articles(
        self,
        page: int = 1,
        per_page: int = 20,
        category: str | None = None,
        sort: str = "created_at",
        order: str = "desc",
    ) -> tuple[list[Article], PaginationMeta]:
        base = select(Article)
        count_stmt = select(func.count(Article.id))

        if category is not None:
            base = base.where(Article.category == category)
            count_stmt = count_stmt.where(Article.category == category)

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        sort_column = getattr(Article, sort, Article.created_at)
        if order == "asc":
            base = base.order_by(sort_column.asc())
        else:
            base = base.order_by(sort_column.desc())

        offset = (page - 1) * per_page
        base = base.offset(offset).limit(per_page)

        result = await self.db.execute(base)
        articles = list(result.scalars().all())

        meta = PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            total_pages=math.ceil(total / per_page) if per_page > 0 else 0,
        )
        return articles, meta

    async def create_article(self, data: ArticleCreate) -> Article:
        article = Article(**data.model_dump())
        self.db.add(article)
        await self.db.commit()
        await self.db.refresh(article)
        return article

    async def update_article(self, article_id: int, data: ArticleUpdate) -> Article:
        article = await self.get_article(article_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(article, key, value)
        await self.db.commit()
        await self.db.refresh(article)
        return article

    async def delete_article(self, article_id: int) -> None:
        article = await self.get_article(article_id)
        await self.db.delete(article)
        await self.db.commit()

    async def list_categories(self) -> list[CategoryItem]:
        stmt = (
            select(Article.category, func.count(Article.id).label("article_count"))
            .where(Article.category.is_not(None))
            .group_by(Article.category)
            .order_by(func.count(Article.id).desc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            CategoryItem(name=row.category, article_count=row.article_count)
            for row in rows
        ]
