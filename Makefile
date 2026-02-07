# TechInsight 開発用 Makefile

# デフォルト値（.env があれば上書きされる）
POSTGRES_USER ?= postgres
POSTGRES_DB ?= techinsight

-include .env

COMPOSE = docker compose

.DEFAULT_GOAL := help

# ==============================================================================
# Docker Compose
# ==============================================================================

.PHONY: up
up: ## 全サービスをバックグラウンド起動
	$(COMPOSE) up -d

.PHONY: up-build
up-build: ## ビルドしてから起動
	$(COMPOSE) up -d --build

.PHONY: down
down: ## 全サービス停止・削除
	$(COMPOSE) down

.PHONY: restart
restart: ## 再起動
	$(COMPOSE) restart

.PHONY: ps
ps: ## コンテナ状態確認
	$(COMPOSE) ps

# ==============================================================================
# ログ
# ==============================================================================

.PHONY: logs
logs: ## 全サービスのログをフォロー
	$(COMPOSE) logs -f

.PHONY: logs-backend
logs-backend: ## backend のログをフォロー
	$(COMPOSE) logs -f backend

.PHONY: logs-db
logs-db: ## db のログをフォロー
	$(COMPOSE) logs -f db

.PHONY: logs-frontend
logs-frontend: ## frontend のログをフォロー
	$(COMPOSE) logs -f frontend

# ==============================================================================
# PostgreSQL
# ==============================================================================

.PHONY: db-shell
db-shell: ## psql でインタラクティブ接続
	$(COMPOSE) exec db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

.PHONY: db-tables
db-tables: ## テーブル一覧表示
	$(COMPOSE) exec db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c '\dt'

.PHONY: db-articles
db-articles: ## articles テーブルの先頭10件表示
	$(COMPOSE) exec db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c 'SELECT * FROM articles LIMIT 10;'

.PHONY: db-count
db-count: ## articles のレコード数表示
	$(COMPOSE) exec db psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c 'SELECT COUNT(*) FROM articles;'

# ==============================================================================
# 開発ユーティリティ
# ==============================================================================

.PHONY: backend-shell
backend-shell: ## backend コンテナに bash 接続
	$(COMPOSE) exec backend bash

.PHONY: migrate
migrate: ## Alembic マイグレーション実行
	$(COMPOSE) exec backend alembic upgrade head

.PHONY: seed
seed: ## 初期データ投入
	$(COMPOSE) exec backend python -m scripts.seed_data

.PHONY: help
help: ## コマンド一覧表示
	@echo "Usage: make [target]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
