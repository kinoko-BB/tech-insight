# TechInsight 実装計画書

## 1. プロジェクト概要

TechInsightは、技術記事を収集・検索できるWebアプリケーションです。
セマンティック検索とキーワード検索機能を提供します。

## 2. 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 16.x | Reactフレームワーク |
| React | 19.x | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Tailwind CSS | 4.x | スタイリング |
| React Query | 5.x | サーバー状態管理 |

### バックエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| FastAPI | 0.128.x | APIフレームワーク |
| Python | 3.13 | バックエンド言語 |
| SQLAlchemy | 2.0.46 | ORM |
| Pydantic | 2.12.x | バリデーション |
| uvicorn | 0.40.x | ASGIサーバー |
| Alembic | 1.18.x | DBマイグレーション |
| psycopg | 3.3.x | PostgreSQL同期ドライバ |
| asyncpg | 0.31.x | PostgreSQL非同期ドライバ |
| sentence-transformers | 5.2.x | Embedding生成 |
| pydantic-settings | 2.12.x | 環境変数設定管理 |
| python-multipart | 0.0.x | multipart/form-data サポート |
| pgvector (Python) | 0.4.x | pgvector SQLAlchemyバインディング |

### データベース
| 技術 | バージョン | 用途 |
|------|-----------|------|
| PostgreSQL | 17 | メインDB |
| pgvector (拡張) | 0.8.x | ベクトル検索 |
| pg_trgm | - | 類似文字列検索 |

### AI/ML
| 技術 | 用途 |
|------|------|
| sentence-transformers | Embedding生成 |
| multilingual-e5-small | 多言語対応軽量モデル（384次元） |

### インフラ
| 技術 | 用途 |
|------|------|
| Docker | コンテナ化 |
| Docker Compose | ローカル開発環境 |
| uv | Pythonパッケージマネージャ |

## 3. ディレクトリ構成

```
tech-insight/
├── docker-compose.yml
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TECHNICAL_DECISIONS.md
│   ├── api-design.md
│   └── db-design.md
│
├── frontend/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx             # 記事一覧（メイン画面）
│   │   ├── globals.css
│   │   ├── admin/
│   │   │   └── page.tsx         # 管理画面（記事投稿・編集・削除）
│   │   └── search/
│   │       └── page.tsx
│   ├── components/              # UIコンポーネント
│   │   ├── ui/                  # 基本UI部品
│   │   ├── article/             # 記事関連（モーダル含む）
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleModal.tsx    # 記事詳細モーダル
│   │   │   └── ArticleForm.tsx     # 記事作成・編集フォーム（react-hook-form + zod）
│   │   ├── search/              # 検索関連
│   │   └── category/            # カテゴリ関連
│   ├── lib/                     # ユーティリティ
│   │   ├── api.ts               # APIクライアント
│   │   ├── validations.ts       # zodスキーマ定義
│   │   └── utils.ts
│   ├── types/                   # 型定義
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPIエントリーポイント
│   │   ├── config.py            # 設定
│   │   ├── database.py          # DB接続
│   │   ├── models/              # SQLAlchemyモデル
│   │   │   ├── __init__.py
│   │   │   └── article.py
│   │   ├── schemas/             # Pydanticスキーマ
│   │   │   ├── __init__.py
│   │   │   └── article.py
│   │   ├── routers/             # APIルーター
│   │   │   ├── __init__.py
│   │   │   ├── articles.py
│   │   │   ├── categories.py
│   │   │   ├── health.py
│   │   │   └── search.py
│   │   ├── services/            # ビジネスロジック
│   │   │   ├── __init__.py
│   │   │   ├── article_service.py
│   │   │   ├── search_service.py
│   │   │   └── embedding_service.py
│   │   └── utils/               # ユーティリティ
│   │       └── __init__.py
│   ├── scripts/
│   │   ├── seed_data.py             # 初期データ投入（articles.csv読み込み）
│   │   ├── generate_embeddings.py   # Embedding一括生成
│   │   └── entrypoint.sh            # 起動スクリプト（マイグレーション→シード→Embedding生成→アプリ起動）
│   ├── requirements.txt
│   └── Dockerfile
│
├── articles.csv                 # 初期データ（1000件）
│
├── tests/                       # テスト
│   ├── conftest.py              # pytest フィクスチャ
│   └── test_articles_api.py     # 記事API統合テスト
│
└── docs/
    ├── IMPLEMENTATION_PLAN.md
    ├── TECHNICAL_DECISIONS.md
    ├── api-design.md
    ├── db-design.md
    └── submission/              # 提出用ドキュメント
        └── DESIGN_EXPLANATION.md  # 実装説明・工夫した点
```

## 4. 実装フェーズ

### Phase 1: 基盤構築
**目標:** 開発環境とDB基盤の整備

- [ ] Docker Compose設定（PostgreSQL + pgvector）
- [ ] FastAPI基本構成
- [ ] Next.js基本構成
- [ ] AlembicによるDBマイグレーション設定
- [ ] Embeddingモデル（multilingual-e5-small）をDockerイメージに事前キャッシュ

### Phase 2: コア機能実装
**目標:** 記事CRUD機能の実装

- [ ] 記事モデル・スキーマ定義
- [ ] 記事CRUD API実装
- [ ] 初期データ投入スクリプト（articles.csv → DB）
- [ ] 記事一覧画面
- [ ] 記事詳細モーダル（一覧画面上で開閉）
- [ ] 管理機能（記事の投稿・編集・削除フォーム / react-hook-form + zod）
- [ ] カテゴリフィルタ機能

### Phase 3: 検索機能実装
**目標:** 検索機能の実装

- [ ] Embedding生成サービス
- [ ] 記事作成・更新時のEmbedding自動生成（title/content変更時に再生成）
- [ ] セマンティック検索API
- [ ] キーワード検索API（pg_trgm）
- [ ] 検索UI実装

### Phase 4: テスト・最適化・仕上げ
**目標:** 品質保証とパフォーマンス改善

- [ ] pytestによるバックエンドAPI統合テスト（CRUD・検索エンドポイント）
- [ ] HNSWインデックス最適化
- [ ] ページネーション実装
- [ ] エラーハンドリング強化
- [ ] UIブラッシュアップ

## 5. 開発ガイドライン

### コーディング規約
- **Python:** PEP 8準拠、型ヒント必須
- **TypeScript:** strict mode有効
- **コミット:** Conventional Commits形式

### ブランチ戦略
```
main
 └── feature/xxx
```

### レビュー観点
- 型安全性
- エラーハンドリング
- パフォーマンス影響

## 6. Docker Compose 起動フロー

`docker compose up` 一発で以下の全工程が自動実行される設計:

```
docker compose up
  │
  ├── db (PostgreSQL + pgvector)
  │     └── 起動完了を待機
  │
  ├── backend (FastAPI)
  │     └── entrypoint.sh が順次実行:
  │           1. Alembic マイグレーション実行
  │           2. articles.csv からの初期データ投入（未投入時のみ）
  │           3. Embedding未生成レコードのEmbedding一括生成
  │           4. uvicorn でAPIサーバー起動
  │
  └── frontend (Next.js)
        └── APIサーバーの起動を待機し、Next.jsサーバー起動
```

### Embeddingモデルのキャッシュ戦略

```dockerfile
# backend/Dockerfile（抜粋）
# uv を使用した高速パッケージインストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
RUN uv pip install --system --no-cache -r requirements.txt
# ビルド時にモデルを事前ダウンロードしてイメージにキャッシュ
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-small')"
```

- `multilingual-e5-small`（約500MB）をDockerイメージのビルド時にダウンロード
- 初回 `docker compose up` 時のモデルダウンロード待ち時間を排除
- Dockerレイヤーキャッシュにより、再ビルド時もダウンロード不要

## 7. テスト戦略

### バックエンドAPI統合テスト（pytest）

```
tests/
├── conftest.py              # テスト用DBフィクスチャ、テストクライアント
└── test_articles_api.py     # 記事APIの統合テスト
```

**テスト対象:**
- 記事CRUD操作（作成・取得・一覧・更新・削除）
- 検索API（セマンティック・キーワード）
- バリデーションエラー（不正入力時の422レスポンス）
- 存在しないリソースへのアクセス（404レスポンス）
- ページネーション・カテゴリフィルタ

**実行方法:**
```bash
docker compose exec backend pytest tests/ -v
```
