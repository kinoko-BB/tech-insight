"""Seed articles from CSV into the database (idempotent)."""

import csv
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.article import Article

CSV_PATH = Path("/app/articles.csv")


def seed() -> None:
    engine = create_engine(settings.database_url_sync)

    with Session(engine) as session:
        count = session.execute(select(func.count(Article.id))).scalar_one()
        if count > 0:
            print(f"Articles table already has {count} records. Skipping seed.")
            return

        if not CSV_PATH.exists():
            print(f"CSV file not found at {CSV_PATH}. Skipping seed.")
            return

        articles: list[Article] = []
        with open(CSV_PATH, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                published_at = None
                if row.get("published_at"):
                    published_at = datetime.fromisoformat(row["published_at"])

                articles.append(
                    Article(
                        title=row["title"],
                        content=row["content"],
                        author=row.get("author") or None,
                        category=row.get("category") or None,
                        published_at=published_at,
                    )
                )

        session.add_all(articles)
        session.commit()
        print(f"Seeded {len(articles)} articles.")


if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        print(f"Seed failed: {e}", file=sys.stderr)
        sys.exit(1)
