# TechInsight API設計書

## 1. 概要

本ドキュメントは、TechInsightのREST API設計を定義します。
FastAPIを使用し、OpenAPI 3.0準拠のAPIを提供します。

**ベースURL:** `http://localhost:8000/api/v1`

## 2. 共通仕様

### 2.1 リクエストヘッダー

| ヘッダー | 値 | 必須 | 説明 |
|---------|---|------|------|
| Content-Type | application/json | POST/PUT時 | リクエストボディの形式 |
| Accept | application/json | 推奨 | レスポンス形式 |

### 2.2 レスポンス形式

**成功時:**
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

**エラー時:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "タイトルは必須です",
    "details": [
      {
        "field": "title",
        "message": "この項目は必須です"
      }
    ]
  }
}
```

### 2.3 HTTPステータスコード

| コード | 意味 | 使用場面 |
|--------|------|---------|
| 200 | OK | 正常完了（取得・更新） |
| 201 | Created | リソース作成成功 |
| 204 | No Content | 削除成功 |
| 400 | Bad Request | リクエスト不正 |
| 404 | Not Found | リソース未存在 |
| 422 | Unprocessable Entity | バリデーションエラー |
| 500 | Internal Server Error | サーバーエラー |

### 2.4 ページネーション

リスト取得APIは以下のクエリパラメータでページネーションをサポート:

| パラメータ | デフォルト | 最大値 | 説明 |
|-----------|-----------|-------|------|
| page | 1 | - | ページ番号 |
| per_page | 20 | 100 | 1ページあたりの件数 |

## 3. エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /articles | 記事一覧取得 |
| POST | /articles | 記事作成 |
| GET | /articles/{id} | 記事詳細取得 |
| PUT | /articles/{id} | 記事更新 |
| DELETE | /articles/{id} | 記事削除 |
| GET | /search | 検索（セマンティック/キーワード） |
| GET | /categories | カテゴリ一覧取得 |
| GET | /health | ヘルスチェック |

## 4. 記事API

### 4.1 GET /articles - 記事一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| page | integer | No | 1 | ページ番号 |
| per_page | integer | No | 20 | 1ページあたりの件数 |
| category | string | No | - | カテゴリでフィルタ（Frontend, Backend, DevOps, AI/ML） |
| sort | string | No | created_at | ソート項目 |
| order | string | No | desc | ソート順（asc/desc） |

**レスポンス (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Implementing PostgreSQL: Database schema design and query optimization",
      "content": "In this article, we will focus on implementing PostgreSQL...",
      "author": "Ito",
      "category": "Backend",
      "published_at": "2025-09-19T22:00:00Z",
      "created_at": "2025-09-19T22:00:00Z"
    }
  ],
  "meta": {
    "total": 1000,
    "page": 1,
    "per_page": 20,
    "total_pages": 50
  }
}
```

### 4.2 POST /articles - 記事作成

**リクエストボディ:**
```json
{
  "title": "Implementing PostgreSQL: Database schema design",
  "content": "In this article, we will focus on implementing PostgreSQL...",
  "author": "Ito",
  "category": "Backend",
  "published_at": "2025-09-19T22:00:00Z"
}
```

| フィールド | 型 | 必須 | 最大長 | 説明 |
|-----------|---|------|-------|------|
| title | string | Yes | 255 | 記事タイトル |
| content | string | Yes | - | 記事本文 |
| author | string | No | 255 | 著者名 |
| category | string | No | 100 | カテゴリ（Frontend, Backend, DevOps, AI/ML） |
| published_at | string | No | - | 公開日時（ISO 8601） |

**レスポンス (201 Created):**
```json
{
  "data": {
    "id": 1,
    "title": "Implementing PostgreSQL: Database schema design",
    "content": "In this article, we will focus on implementing PostgreSQL...",
    "author": "Ito",
    "category": "Backend",
    "published_at": "2025-09-19T22:00:00Z",
    "created_at": "2025-09-19T22:00:00Z",
    "updated_at": "2025-09-19T22:00:00Z"
  }
}
```

**備考:** 記事作成時にEmbeddingが同期的に生成される。Embedding生成はサービス層で自動実行されるため、クライアントが意識する必要はない。

### 4.3 GET /articles/{id} - 記事詳細取得

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 記事ID |

**レスポンス (200 OK):**
```json
{
  "data": {
    "id": 1,
    "title": "Implementing PostgreSQL: Database schema design and query optimization",
    "content": "In this article, we will focus on implementing PostgreSQL. We discuss how database schema design and query optimization can significantly improve your backend workflow...",
    "author": "Ito",
    "category": "Backend",
    "published_at": "2025-09-19T22:00:00Z",
    "created_at": "2025-09-19T22:00:00Z",
    "updated_at": "2025-09-19T22:00:00Z"
  }
}
```

**エラーレスポンス (404 Not Found):**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "記事が見つかりません"
  }
}
```

### 4.4 PUT /articles/{id} - 記事更新

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 記事ID |

**リクエストボディ:**
```json
{
  "title": "Implementing PostgreSQL: Updated guide",
  "content": "Updated content...",
  "author": "Ito",
  "category": "Backend"
}
```

**レスポンス (200 OK):**
記事作成時と同じ形式

**備考:** `title`または`content`が変更された場合、Embeddingベクトルが自動的に再生成される。`author`や`category`のみの変更ではEmbeddingは再生成されない。

### 4.5 DELETE /articles/{id} - 記事削除

**パスパラメータ:**

| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 記事ID |

**レスポンス (204 No Content):**
ボディなし

## 5. 検索API

### 5.1 GET /search - 検索

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| q | string | Yes | - | 検索クエリ |
| mode | string | No | semantic | 検索モード（semantic/keyword） |
| page | integer | No | 1 | ページ番号 |
| per_page | integer | No | 20 | 1ページあたりの件数 |
| category | string | No | - | カテゴリでフィルタ |

**検索モード:**

| モード | 説明 |
|--------|------|
| semantic | ベクトル類似度検索（意味的な類似性） |
| keyword | キーワード検索（pg_trgm） |

**リクエスト例:**
```
GET /search?q=React component architecture&mode=semantic&per_page=10
```

**レスポンス (200 OK):**
```json
{
  "data": [
    {
      "id": 11,
      "title": "Mastering React: Type-safe application development",
      "content": "In this article, we will focus on mastering React...",
      "author": "Ito",
      "category": "Frontend",
      "published_at": "2024-04-23T00:00:00Z",
      "score": 0.892,
      "created_at": "2024-04-23T00:00:00Z"
    },
    {
      "id": 98,
      "title": "Refactoring React: Component architecture and hooks efficiency",
      "content": "In this article, we will focus on refactoring React...",
      "author": "Suzuki",
      "category": "Frontend",
      "published_at": "2024-12-14T04:00:00Z",
      "score": 0.856,
      "created_at": "2024-12-14T04:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 10,
    "total_pages": 5,
    "query": "React component architecture",
    "mode": "semantic"
  }
}
```

## 6. カテゴリAPI

### 6.1 GET /categories - カテゴリ一覧取得

**レスポンス (200 OK):**
```json
{
  "data": [
    { "name": "Frontend", "article_count": 250 },
    { "name": "Backend", "article_count": 280 },
    { "name": "DevOps", "article_count": 230 },
    { "name": "AI/ML", "article_count": 240 }
  ]
}
```

## 7. ヘルスチェックAPI

### 7.1 GET /health - ヘルスチェック

**レスポンス (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "embedding_model": "loaded"
}
```

## 8. エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VALIDATION_ERROR | 422 | 入力値バリデーションエラー |
| NOT_FOUND | 404 | リソースが存在しない |
| DUPLICATE_ENTRY | 409 | 重複エントリー |
| INTERNAL_ERROR | 500 | サーバー内部エラー |
| DATABASE_ERROR | 500 | データベースエラー |
| EMBEDDING_ERROR | 500 | Embedding生成エラー |

## 9. レート制限

現バージョンではレート制限は未実装。
将来的に以下の制限を検討:

| エンドポイント | 制限 |
|---------------|------|
| 検索API | 100 req/min |
| 記事作成 | 10 req/min |
| その他 | 1000 req/min |
