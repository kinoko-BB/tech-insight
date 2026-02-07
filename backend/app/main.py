from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.exceptions import AppException
from app.routers import articles, categories, health, search

app = FastAPI(
    title="TechInsight API",
    version=settings.app_version,
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
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
