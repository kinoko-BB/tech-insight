"""create articles table

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Table
    op.create_table(
        "articles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column(
            "published_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column("embedding", Vector(384), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # HNSW index for vector similarity search
    op.execute(
        """
        CREATE INDEX idx_articles_embedding_hnsw ON articles
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 128)
        """
    )

    # GIN + pg_trgm indexes for text search
    op.execute(
        """
        CREATE INDEX idx_articles_title_trgm ON articles
        USING gin (title gin_trgm_ops)
        """
    )
    op.execute(
        """
        CREATE INDEX idx_articles_content_trgm ON articles
        USING gin (content gin_trgm_ops)
        """
    )

    # B-tree indexes
    op.execute(
        "CREATE INDEX idx_articles_published_at ON articles (published_at DESC NULLS LAST)"
    )
    op.execute(
        "CREATE INDEX idx_articles_created_at ON articles (created_at DESC)"
    )
    op.execute(
        "CREATE INDEX idx_articles_category ON articles (category)"
    )


def downgrade() -> None:
    op.drop_table("articles")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
    op.execute("DROP EXTENSION IF EXISTS vector")
