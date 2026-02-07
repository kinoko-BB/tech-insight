from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import articles, categories, health, search

app = FastAPI(
    title="TechInsight API",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(articles.router, prefix="/api/v1", tags=["articles"])
app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(categories.router, prefix="/api/v1", tags=["categories"])
