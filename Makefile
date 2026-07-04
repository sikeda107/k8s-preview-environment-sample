ENVOY_GATEWAY_VERSION := v1.4.2

.DEFAULT_GOAL := help

.PHONY: help
help: ## ターゲット一覧を表示する
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: kind-create
kind-create: ## kind クラスタを作成する
	kind create cluster --name preview-sample --config hack/kind-config.yaml

.PHONY: gateway-install
gateway-install: ## Envoy Gateway をインストールして起動を待機する
	kubectl apply --server-side -f https://github.com/envoyproxy/gateway/releases/download/$(ENVOY_GATEWAY_VERSION)/install.yaml
	kubectl wait --timeout=300s -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available

.PHONY: image-build
image-build: ## アプリのコンテナイメージをビルドする
	docker build -t nextjs:local app

.PHONY: image-load
image-load: ## ビルドしたイメージを kind クラスタにロードする
	kind load docker-image nextjs:local --name preview-sample

.PHONY: deploy
deploy: ## kind 環境に Kubernetes リソースを適用する
	kubectl apply -k k8s/kind

# Job は immutable なため再実行時は既存 Job を削除してから適用する
.PHONY: migrate
migrate: ## migration Job を削除してから再適用する
	kubectl -n local delete job db-migrate --ignore-not-found
	kubectl apply -k k8s/kind

.PHONY: port-forward
port-forward: ## Envoy の Service にポートフォワードする
	kubectl -n envoy-gateway-system port-forward $$(kubectl -n envoy-gateway-system get svc -l gateway.envoyproxy.io/owning-gateway-name=local-gateway -o name) 8080:80

.PHONY: kind-delete
kind-delete: ## kind クラスタを削除する
	kind delete cluster --name preview-sample

.PHONY: up
up: kind-create gateway-install image-build image-load deploy ## クラスタ作成からデプロイまで一括で実行する
