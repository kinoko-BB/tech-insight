# TechInsight データベース設計書

## 1. 概要

本ドキュメントは、TechInsightのデータベース設計を定義します。
PostgreSQL 15以上を使用し、pgvector拡張によるベクトル検索をサポートします。

## 2. ER図

```
┌─────────────────────────────────────────────────────────────┐
│                         articles                             │
├─────────────────────────────────────────────────────────────┤
│ PK │ id              │ SERIAL                               │
├────┼─────────────────┼──────────────────────────────────────┤
│    │ title           │ VARCHAR(255) NOT NULL                │
│    │ content         │ TEXT NOT NULL                        │
│    │ author          │ VARCHAR(255)                         │
│    │ category        │ VARCHAR(100)                         │
│    │ published_at    │ TIMESTAMP WITH TIME ZONE             │
│    │ embedding       │ VECTOR(384)                          │
│    │ created_at      │ TIMESTAMP WITH TIME ZONE NOT NULL    │
│    │ updated_at      │ TIMESTAMP WITH TIME ZONE NOT NULL    │
└─────────────────────────────────────────────────────────────┘
```

**注:** 初期データ（articles.csv）はカテゴリベースのシンプルな構造のため、
タグの多対多関係は実装していません。将来拡張として検討可能です。

## 3. テーブル定義

### 3.1 articles（記事テーブル）

技術記事の本体を格納するメインテーブル。

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | SERIAL | NO | auto | 主キー |
| title | VARCHAR(255) | NO | - | 記事タイトル |
| content | TEXT | NO | - | 記事本文 |
| author | VARCHAR(255) | YES | NULL | 著者名 |
| category | VARCHAR(100) | YES | NULL | カテゴリ（Frontend, Backend, DevOps, AI/ML） |
| published_at | TIMESTAMPTZ | YES | NULL | 公開日時 |
| embedding | VECTOR(384) | YES | NULL | 記事のEmbeddingベクトル |
| created_at | TIMESTAMPTZ | NO | CURRENT_TIMESTAMP | レコード作成日時 |
| updated_at | TIMESTAMPTZ | NO | CURRENT_TIMESTAMP | レコード更新日時 |

**DDL:**
```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255),
    category VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE,
    embedding VECTOR(384),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 categories（参考：カテゴリ一覧）

初期データに含まれるカテゴリ:

| カテゴリ名 | 説明 |
|-----------|------|
| Frontend | フロントエンド開発（React, Vue.js, Next.js, TypeScript, Tailwind CSS） |
| Backend | バックエンド開発（PostgreSQL, Redis, FastAPI, GraphQL, Node.js, Python） |
| DevOps | インフラ・運用（Kubernetes, Docker, AWS, Terraform, CI/CD） |
| AI/ML | AI・機械学習（LLM, PyTorch, Hugging Face, OpenAI API, Vector Database） |

## 4. インデックス設計

### 4.1 ベクトル検索インデックス（HNSW）

```sql
-- セマンティック検索用HNSWインデックス
CREATE INDEX idx_articles_embedding_hnsw ON articles
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);
```

**パラメータ設計根拠:**
- `m = 16`: 1000件規模では標準的な値。検索精度と速度のバランス
- `ef_construction = 128`: インデックス構築時の精度。高めに設定し品質確保

### 4.2 全文検索インデックス（pg_trgm）

```sql
-- pg_trgm拡張の有効化
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- タイトルの類似検索用
CREATE INDEX idx_articles_title_trgm ON articles
USING gin (title gin_trgm_ops);

-- 本文の類似検索用
CREATE INDEX idx_articles_content_trgm ON articles
USING gin (content gin_trgm_ops);
```

### 4.3 その他のインデックス

```sql
-- 日時でのソート用
CREATE INDEX idx_articles_published_at ON articles (published_at DESC NULLS LAST);
CREATE INDEX idx_articles_created_at ON articles (created_at DESC);

-- カテゴリでのフィルタ用
CREATE INDEX idx_articles_category ON articles (category);
```

## 5. 拡張機能

### 5.1 必要な拡張

```sql
-- ベクトル演算用
CREATE EXTENSION IF NOT EXISTS vector;

-- 類似文字列検索用
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## 6. マイグレーション

### 6.1 初期マイグレーション

```sql
-- 001_initial.sql

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- テーブル作成
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255),
    category VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE,
    embedding VECTOR(384),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_articles_embedding_hnsw ON articles
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);

CREATE INDEX idx_articles_title_trgm ON articles
USING gin (title gin_trgm_ops);

CREATE INDEX idx_articles_content_trgm ON articles
USING gin (content gin_trgm_ops);

CREATE INDEX idx_articles_published_at ON articles (published_at DESC NULLS LAST);
CREATE INDEX idx_articles_created_at ON articles (created_at DESC);
CREATE INDEX idx_articles_category ON articles (category);
```

## 7. パフォーマンス考慮事項

### 7.1 ベクトル検索

- **検索時ef_search:** クエリ時に`SET hnsw.ef_search = 100;`で精度調整可能
- **バッチ処理:** Embedding生成は非同期バッチ処理で実行
- **NULL対応:** embeddingがNULLの記事は通常検索のみ対象

### 7.2 スケーラビリティ

| 記事数 | 推奨設定 |
|--------|---------|
| ~1000件 | 現設定で十分（初期データ規模） |
| ~10万件 | ef_construction=256, m=32 に増加 |
| 10万件超 | Qdrant/Milvus等の専用DBを検討 |

### 7.3 メンテナンス

```sql
-- 統計情報の更新（定期実行推奨）
ANALYZE articles;

-- インデックスの再構築（大量更新後）
REINDEX INDEX idx_articles_embedding_hnsw;
```
