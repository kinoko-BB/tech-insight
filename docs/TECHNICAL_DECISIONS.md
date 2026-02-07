# TechInsight 技術的決定事項

## 概要

本ドキュメントは、TechInsightの開発において行った重要な技術的決定とその理由を記録します。
採点者・レビュアーが設計意図を理解しやすいよう、各決定の背景と代替案との比較を記載しています。

---

## 1. Embeddingモデル: sentence-transformers

### 選択: sentence-transformers + multilingual-e5-small

### 決定理由

1. **APIキー不要でローカル実行可能**
   - 評価者の環境再現要件を満たす
   - 外部サービスへの依存なし
   - オフライン環境でも動作

2. **日本語対応の軽量モデル**
   - multilingual-e5-smallは多言語対応（384次元）
   - e5-baseと比較して検索品質の差は実用上問題ないレベル
   - CPU環境での初期データ1000件のEmbedding生成が現実的な時間で完了
   - Dockerイメージサイズも約500MBに抑制

3. **Python環境での直接動作**
   - FastAPIと同一プロセスで実行可能
   - 追加サービス（別コンテナ等）不要
   - デプロイ構成がシンプル

### 代替案との比較

| 選択肢 | メリット | デメリット | 判定 |
|--------|---------|-----------|------|
| **sentence-transformers (e5-small)** | APIキー不要、軽量、CPU実用的 | 精度はe5-baseよりやや劣る | ✅ 採用 |
| sentence-transformers (e5-base) | 高精度 | CPU環境で1000件処理に数十分 | ❌ 起動時間 |
| OpenAI Embeddings | 高精度、高速 | APIキー必須 | ❌ 要件不適合 |
| Ollama + nomic-embed | GPU活用可能 | Docker構成複雑化 | ❌ 過剰 |
| Cohere Embeddings | 多言語対応 | APIキー必須 | ❌ 要件不適合 |
| EmbeddingGemma-300M | MTEB最高クラス、MRL対応 | リリース4ヶ月、実績少 | ❌ 成熟度 |

### Embedding モデルの選定: EmbeddingGemma-300M を検討したが e5-small を採用

#### 検討した代替案: EmbeddingGemma-300M

Google が2025年9月にリリースした最新モデル。MTEB で500M未満クラス最高スコア。

**採用しなかった理由:**
1. **プロジェクト規模**: 1000件規模では e5-small（384次元）で十分
2. **エコシステム成熟度**: EmbeddingGemma はリリース4ヶ月で実績少ない
3. **評価者環境での確実性**: e5-small は2年以上の実績、トラブルリスク最小
4. **Docker イメージサイズ**: e5-small（500MB）の方が軽量

**将来的な移行計画:**
- 記事数が1万件を超えた場合、EmbeddingGemma-300M への移行を検討
- MRL により 768→256次元に切り詰めることで、ストレージは e5-small と同等に維持可能

### 実装上の工夫

```python
# バッチ処理でパフォーマンス確保
def generate_embeddings_batch(texts: list[str], batch_size: int = 32):
    """バッチ処理でEmbedding生成（メモリ効率化）"""
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_embeddings = model.encode(batch)
        embeddings.extend(batch_embeddings)
    return embeddings
```

---

## 2. ベクトルDB: pgvector

### 選択: PostgreSQL + pgvector拡張

### 決定理由

1. **追加サービス不要**
   - PostgreSQL拡張として動作
   - 別途ベクトルDBを立てる必要なし
   - Docker Compose構成がシンプル

2. **1万件規模に十分な性能**
   - HNSWインデックスで高速検索
   - 本プロジェクトの規模では過剰性能

3. **SQLAlchemyとの統合が容易**
   - 既存のORMワークフローに組み込み可能
   - 通常のSQLクエリと組み合わせ可能

### 代替案との比較

| 選択肢 | 適正規模 | メリット | デメリット | 判定 |
|--------|---------|---------|-----------|------|
| **pgvector** | ~100万件 | 追加サービス不要 | 超大規模には不向き | ✅ 採用 |
| Qdrant | 100万~数億件 | 高性能、豊富な機能 | 別サービス必要 | ❌ 過剰 |
| Milvus | 数億件~ | エンタープライズ向け | 構成が複雑 | ❌ 過剰 |
| Pinecone | 任意 | フルマネージド | APIキー必須 | ❌ 要件不適合 |

### インデックス設計の根拠

```sql
CREATE INDEX idx_articles_embedding_hnsw ON articles
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);
```

| パラメータ | 値 | 理由 |
|-----------|---|------|
| m | 16 | 1000件規模では十分。検索精度と速度のバランス |
| ef_construction | 128 | インデックス構築精度。高めに設定し品質確保 |
| vector_cosine_ops | - | コサイン類似度。テキスト検索に最適 |

---

## 3. DBドライバ: psycopg 3

### 選択: psycopg 3（psycopg2 からの移行）

### 決定理由

1. **psycopg2 のメンテナンス終了**
   - psycopg2 は事実上レガシー扱い
   - psycopg 3 が公式推奨の後継ドライバ

2. **Python 3.13 との親和性**
   - ネイティブ非同期サポート（asyncio対応）
   - 型ヒントの充実
   - C拡張に依存しないPure Python実装も提供

3. **SQLAlchemy 2.x での公式サポート**
   - `postgresql+psycopg://` スキームで直接利用可能
   - Connection Pool との統合が安定

### 代替案との比較

| 選択肢 | メリット | デメリット | 判定 |
|--------|---------|-----------|------|
| **psycopg 3** | 公式推奨、非同期対応、型安全 | psycopg2 とのAPI差分あり | ✅ 採用 |
| psycopg2 | 実績豊富、情報多い | メンテナンス終了方向 | ❌ レガシー |

---

## 4. パッケージマネージャ: uv

### 選択: uv（pip からの移行）

### 決定理由

1. **パッケージインストールの高速化**
   - Rust実装による10〜100倍の速度向上
   - Dockerビルド時間の大幅短縮

2. **pip 互換の使い勝手**
   - `uv pip install` で既存の `requirements.txt` をそのまま利用可能
   - 学習コストがほぼゼロ

3. **Astral社による積極的なメンテナンス**
   - Ruff と同じ開発元による信頼性
   - Python エコシステムの新標準として急速に普及

---

## 5. フロントエンド: Tailwind CSS

### 選択: Tailwind CSS 4.x

### 決定理由

1. **Next.js 16との相性**
   - 公式サポート、設定が容易
   - App Routerとの統合実績豊富

2. **ユーティリティファーストで高速開発**
   - コンポーネント単位でスタイル完結
   - CSSファイル間の依存関係なし
   - デザインシステムの一貫性維持が容易

3. **バンドルサイズ最適化**
   - PurgeCSSによる未使用スタイル削除
   - 本番ビルドで最小限のCSSのみ出力

### 代替案との比較

| 選択肢 | メリット | デメリット | 判定 |
|--------|---------|-----------|------|
| **Tailwind CSS** | 高速開発、小バンドル | 学習コスト | ✅ 採用 |
| CSS Modules | スコープ安全 | ファイル分散 | ❌ 開発効率 |
| styled-components | CSS-in-JS | バンドルサイズ増 | ❌ パフォーマンス |
| shadcn/ui | コンポーネント提供 | Tailwind前提 | 🔄 併用検討 |

---

## 6. 検索戦略: セマンティック検索 + キーワード検索

### 選択: セマンティック検索 + キーワード検索の切替方式

### 設計方針

1. **セマンティック検索をデフォルト**
   - 意味的な類似性で関連記事を発見
   - 「Reactのパフォーマンス」→ useMemo, useCallback関連記事もヒット

2. **キーワード検索も提供**
   - 特定のエラーメッセージ検索など、完全一致が必要なケース
   - pg_trgmによる類似文字列検索

3. **ユーザーが切替可能**
   - UIで検索モードを選択可能
   - ユースケースに応じた使い分け

### 実装アプローチ

```python
async def search(query: str, mode: SearchMode) -> list[Article]:
    match mode:
        case SearchMode.SEMANTIC:
            return await semantic_search(query)
        case SearchMode.KEYWORD:
            return await keyword_search(query)
```

---

## 7. パフォーマンス設計

### 1000件対応の設計ポイント

| 観点 | 対策 | 効果 |
|------|------|------|
| ベクトル検索 | HNSWインデックス | O(log n)の検索時間 |
| 一覧取得 | ページネーション必須 | メモリ使用量制限 |
| Embedding生成 | バッチ処理 | スループット向上 |
| DB接続 | コネクションプール | 接続オーバーヘッド削減 |

### スケーラビリティ観点

```
現在の設計（1000件 = 初期データ）
    ↓ 記事数増加
Phase 2対応（~10万件）
  - HNSWパラメータ調整（m=32, ef_construction=256）
  - Redis キャッシュ導入
    ↓ さらに増加
Phase 3対応（10万件超）
  - 専用ベクトルDB（Qdrant等）への移行
  - 検索サービスの分離
```

---

## 8. チーム開発対応

### 型定義の徹底

**TypeScript（フロントエンド）:**
```typescript
// 明確な型定義でチーム間の認識齟齬を防止
interface Article {
  id: number;
  title: string;
  content: string;
  author?: string;
  category?: string;  // Frontend, Backend, DevOps, AI/ML
  publishedAt?: string;
  createdAt: string;
}
```

**Pydantic（バックエンド）:**
```python
# バリデーションと型安全性を同時に確保
class ArticleCreate(BaseModel):
    title: str = Field(..., max_length=255)
    content: str
    author: str | None = None
    category: str | None = None
```

### OpenAPI自動生成

- FastAPIの型ヒントからOpenAPI仕様を自動生成
- フロントエンドはOpenAPI仕様から型を生成可能
- API仕様の信頼できる単一ソース（Single Source of Truth）

### レイヤー分離

```
routers/     # HTTPリクエスト処理（入出力変換）
    ↓
services/    # ビジネスロジック（テスト容易）
    ↓
models/      # データアクセス（永続化）
```

**利点:**
- 各レイヤーの責務が明確
- 単体テストが書きやすい
- チームメンバー間での分業が容易

---

## 9. 保守運用観点

### ログ設計

```python
# 構造化ログで検索・分析が容易
logger.info(
    "search_executed",
    query=query,
    mode=mode,
    result_count=len(results),
    duration_ms=duration
)
```

### エラーハンドリング

```python
# 一貫したエラーレスポンス形式
class AppException(Exception):
    def __init__(self, code: str, message: str, status: int = 400):
        self.code = code
        self.message = message
        self.status = status
```

### 環境設定

```python
# 環境変数での設定管理（12 Factor App準拠）
class Settings(BaseSettings):
    database_url: str
    embedding_model: str = "intfloat/multilingual-e5-small"

    class Config:
        env_file = ".env"
```

---

## 10. UI/UX観点

### 検索体験の設計

1. **即座のフィードバック**
   - 検索中のローディング表示
   - 検索結果のスコア表示

2. **検索モードの可視化**
   - 現在の検索モードを明示
   - モード切替UIの直感的な配置

3. **結果の可読性**
   - 要約文の表示
   - ハイライト表示（キーワード検索時）

### レスポンシブ対応

- モバイルファーストのデザイン
- Tailwindのブレークポイント活用

---

## 11. データ設計

### 初期データ（articles.csv）

| 項目 | 値 |
|------|---|
| 記事数 | 1000件 |
| カラム | id, title, content, author, category, published_at |
| カテゴリ | Frontend, Backend, DevOps, AI/ML（各250件程度） |
| 言語 | 英語 |

### カテゴリ vs タグの選択

**選択: カテゴリ（単一値）**

初期データがカテゴリベースの構造のため、シンプルなカテゴリカラムを採用。
将来的にタグの多対多関係が必要になった場合は、別途tags/article_tagsテーブルを追加可能。

---

## 12. 記事更新時のEmbedding再生成

### 方針

記事の`title`または`content`が更新された場合、Embeddingベクトルを再生成する。
これにより、セマンティック検索の結果が常に最新の記事内容と一致することを保証する。

### 実装アプローチ

```python
async def update_article(article_id: int, data: ArticleUpdate) -> Article:
    article = await get_article(article_id)

    # title または content が変更された場合、Embeddingを再生成
    content_changed = (
        (data.title is not None and data.title != article.title) or
        (data.content is not None and data.content != article.content)
    )

    updated = await update_article_in_db(article_id, data)

    if content_changed:
        embedding = generate_embedding(f"{updated.title} {updated.content}")
        await update_article_embedding(article_id, embedding)

    return updated
```

### 設計判断

- **同期実行:** 1件の記事更新に対するEmbedding生成は数百ms程度のため、非同期キューは不要
- **再生成トリガー:** `title`と`content`の変更時のみ（`author`や`category`の変更では再生成しない）
- **入力テキスト形式:** `"query: {title} {content}"` のフォーマットでe5モデルに渡す

---

## 13. フロントエンドテスト: Vitest + React Testing Library + MSW

### 選択: Vitest + React Testing Library + MSW

### 決定理由

1. **Vitest**
   - ESMネイティブ対応でNext.js 16と親和性が高い（Jestは `--experimental-vm-modules` 等の追加設定が必要）
   - Jest互換APIで学習コスト低、TypeScript・JSXゼロ設定

2. **React Testing Library (v16+)**
   - ユーザー操作・表示に着目したテスト（実装詳細に依存しない）
   - React 19対応

3. **MSW v2**
   - ネットワークレベルでfetchをインターセプトし、APIクライアントの実装詳細に依存しないモック
   - `vi.mock` よりも保守性が高い

4. **E2Eテスト (Playwright) は導入しない**
   - 1週間の時間制約、Dockerへのブラウザバイナリ追加コスト
   - バックエンドpytestがAPI統合をカバー済み。将来的な拡張として検討

### 代替案との比較

| 選択肢 | メリット | デメリット | 判定 |
|--------|---------|-----------|------|
| **Vitest** | ESMネイティブ、高速、Jest互換 | エコシステムがJestより小さい | ✅ 採用 |
| Jest | 情報豊富 | ESM設定煩雑 | ❌ 設定コスト |
| **MSW v2** | ネットワークレベルモック | ハンドラ定義が必要 | ✅ 採用 |
| vi.mock | シンプル | 実装詳細への結合度高 | ❌ 保守性 |
| Playwright / Cypress | 実ブラウザE2E | 環境構築コスト大 | ❌ 時間制約 |

---

---

## 14. アーキテクチャ: レポジトリパターンを採用しない

### 決定: SQLAlchemy直接利用（レポジトリパターン不採用）

### 決定理由

1. **プロジェクト規模とエンティティ数**
   - 記事（Article）のみの単一エンティティ
   - ドメインロジックが最小限
   - レポジトリ層を導入するほどの複雑性がない

2. **SQLAlchemyの高機能性**
   - Session APIがすでに抽象化を提供
   - クエリビルダーが柔軟で直感的
   - テスト時のモック化も容易

3. **過剰設計の回避**
   - 1000件規模では追加の抽象化レイヤーが冗長
   - コード量増加によるメンテナンスコスト
   - チーム規模（1人→少人数）に対して過剰

### 実装方針

```python
# services/article_service.py
async def get_articles(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50
) -> list[Article]:
    """SQLAlchemyを直接利用したシンプルな実装"""
    result = await db.execute(
        select(Article)
        .order_by(Article.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
```

### 将来の拡張性

**Phase 2以降（10万件超、複数エンティティ追加時）の検討事項:**
- User、Tag、Comment等のエンティティ追加時にレポジトリ層を導入
- 複雑なクエリロジックが増えた場合に抽象化を検討

---

## 15. 開発体験（DX）の向上

### 1. Makefileによるコマンド集約

**導入理由:**
- 開発者が頻繁に実行するコマンドを短縮化
- Docker Composeの複雑なコマンドを覚える必要なし
- チーム全員が統一されたワークフローで作業可能

**主要コマンド:**

| コマンド | 機能 | 用途 |
|---------|------|------|
| `make dev` | フォアグラウンド起動 | 開発中のログ監視 |
| `make up` | バックグラウンド起動 | バックグラウンド実行 |
| `make logs-backend` | バックエンドログ | デバッグ |
| `make db-shell` | PostgreSQL接続 | DB確認 |
| `make db-count` | レコード数確認 | データ投入確認 |
| `make clean` | 完全クリーンアップ | 環境リセット |
| `make help` | コマンド一覧表示 | 使い方確認 |

**開発フロー例:**
```bash
# 初回起動
make dev-build

# 日常開発
make dev          # ログを見ながら開発
make logs-backend # バックエンドのみ監視

# DB確認
make db-count     # データ投入確認
make db-shell     # SQL直接実行

# トラブル時
make clean        # 完全リセット
make dev-build    # 再構築
```

### 2. Hot Reload対応

**バックエンド（FastAPI + uvicorn）:**
```python
# uvicornの --reload オプションでファイル変更を監視
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

**フロントエンド（Next.js）:**
```javascript
// Next.js標準のFast Refresh機能
// 開発サーバーが自動でReactコンポーネントを差分更新
npm run dev  // turbopack使用で高速リロード
```

**Docker Composeのボリュームマウント:**
```yaml
volumes:
  - ./backend:/app       # バックエンドコード同期
  - ./frontend:/app      # フロントエンドコード同期
  - /app/node_modules    # node_modules除外（パフォーマンス）
```

**開発体験への影響:**
- コード変更後、数秒以内にブラウザ/APIに反映
- コンテナ再起動不要
- 高速なイテレーション開発が可能

---

## 16. テスト戦略

### 概要

プロジェクト規模と開発期間を考慮し、**投資対効果の高いテストに集中**する戦略を採用。

### バックエンド: pytest + 統合テスト中心

**選択: 統合テスト（API E2Eテスト）を優先**

```python
# tests/test_articles_api.py
async def test_create_article(client: AsyncClient):
    """記事作成APIの統合テスト"""
    response = await client.post("/api/articles", json={
        "title": "Test Article",
        "content": "Content",
        "category": "Backend"
    })
    assert response.status_code == 201
    assert response.json()["title"] == "Test Article"
```

**テスト範囲:**
- 記事CRUD操作（作成・取得・一覧・更新・削除）
- セマンティック検索・キーワード検索
- バリデーションエラー（422レスポンス）
- 存在しないリソース（404レスポンス）
- ページネーション・カテゴリフィルタ

**単体テストを最小限にした理由:**
- 1週間の開発期間制約
- ビジネスロジックが薄い（CRUD中心）
- 統合テストでカバー範囲が広い

### フロントエンド: Vitest + React Testing Library + MSW

**テスト方針:**

| レイヤー | テストツール | 対象 | 優先度 |
|---------|------------|------|-------|
| バリデーション | Vitest | zodスキーマ | 高 |
| コンポーネント | RTL | ArticleForm, Modal | 中 |
| API統合 | MSW | fetchクライアント | 中 |
| ページ統合 | RTL + MSW | 管理画面フロー | 低 |

**テスト範囲:**
```typescript
// lib/validations.test.ts
describe('articleCreateSchema', () => {
  it('正常系: 必須項目のみで成功', () => {
    const result = articleCreateSchema.safeParse({
      title: 'Valid Title',
      content: 'Valid Content'
    });
    expect(result.success).toBe(true);
  });

  it('異常系: タイトル空文字でエラー', () => {
    const result = articleCreateSchema.safeParse({
      title: '',
      content: 'Valid Content'
    });
    expect(result.success).toBe(false);
  });
});
```

### E2Eテスト（Playwright）: 導入しない

**理由:**
- 開発期間の制約（1週間）
- Dockerへのブラウザバイナリ追加コスト
- バックエンドpytestでAPI層を十分カバー
- 現時点での費用対効果が低い

**将来的な導入タイミング:**
- ユーザーフローが複雑化した場合（マルチステップフォーム等）
- 本番環境での回帰テストが必要になった場合

### テスト戦略の基本方針

**投資対効果が高いテストに集中:**
1. バックエンド統合テスト（pytestでAPI全体をカバー）
2. バリデーションロジック（zodスキーマの境界値テスト）
3. 重要UIコンポーネント（ArticleFormの送信フロー）

**投資対効果が低いため除外:**
1. E2Eテスト（Playwright）→ 開発期間制約
2. 単体テストの網羅的実装 → ビジネスロジック薄い
3. スタイルのスナップショットテスト → UI変更頻度高い

---

## まとめ

| 観点 | 決定事項 | 主な理由 |
|------|---------|---------|
| Embedding | sentence-transformers (e5-small) | APIキー不要、軽量、CPU実用的 |
| ベクトルDB | pgvector | 追加サービス不要、十分な性能 |
| DBドライバ | psycopg 3 | 公式推奨後継、非同期対応、Python 3.13親和性 |
| パッケージマネージャ | uv | Rust実装で高速、pip互換 |
| フロントエンド | Tailwind CSS | 高速開発、Next.js親和性 |
| 検索 | セマンティック + キーワード | ユースケース対応の柔軟性 |
| 型安全 | TypeScript + Pydantic | チーム開発の品質確保 |
| データ構造 | カテゴリ（単一値） | 初期データに合わせたシンプル設計 |
| アーキテクチャ | レポジトリパターン不採用 | 単一エンティティ、SQLAlchemyで十分 |
| DX | Makefile + Hot Reload | 開発効率向上、統一ワークフロー |
| テスト | 統合テスト中心 | 投資対効果重視、開発期間制約 |
| フロントエンドテスト | Vitest + RTL + MSW | ESMネイティブ、ユーザー視点テスト、実装非依存モック |
