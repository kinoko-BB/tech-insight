from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/techinsight"
    database_url_sync: str = "postgresql+psycopg://postgres:postgres@db:5432/techinsight"
    embedding_model: str = "intfloat/multilingual-e5-small"
    embedding_dimension: int = 384
    batch_size: int = 32
    app_version: str = "0.1.0"

    model_config = {"env_file": ".env"}


settings = Settings()
