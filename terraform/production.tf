# 本番用リソース enable_production_resources が true のときのみ作成する
# Cloud Tasks キュー Pub/Sub topic とサブスクリプション Cloud Storage バケットを含む

# Cloud Tasks キュー メール送信タスクのエンキューに使用する
resource "google_cloud_tasks_queue" "send_email" {
  count = var.enable_production_resources ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = "send-email"

  rate_limits {
    max_dispatches_per_second = 10
    max_concurrent_dispatches = 5
  }

  retry_config {
    max_attempts = 5
    min_backoff  = "10s"
    max_backoff  = "300s"
  }

  depends_on = [google_project_service.services]
}

# Pub/Sub push サブスクリプション用サービスアカウント
# push 配信時に OIDC トークンをリクエストに付与する
resource "google_service_account" "pubsub_invoker" {
  count = var.enable_production_resources ? 1 : 0

  project      = var.project_id
  account_id   = "pubsub-invoker"
  display_name = "Pub/Sub Push Invoker"
  description  = "Pub/Sub push サブスクリプションの OIDC 認証用サービスアカウント"
}

# Pub/Sub topic 注文イベントを publish するために使用する
resource "google_pubsub_topic" "order_events" {
  count = var.enable_production_resources ? 1 : 0

  project = var.project_id
  name    = "order-events"

  depends_on = [google_project_service.services]
}

# Pub/Sub push サブスクリプション アプリの API エンドポイントへ push 配信する
resource "google_pubsub_subscription" "order_events_push" {
  count = var.enable_production_resources ? 1 : 0

  project = var.project_id
  name    = "order-events-push"
  topic   = google_pubsub_topic.order_events[0].id

  push_config {
    push_endpoint = var.pubsub_push_endpoint

    oidc_token {
      service_account_email = google_service_account.pubsub_invoker[0].email
    }
  }

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s"

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }
}

# Cloud Storage バケット 領収書ファイルを保存するために使用する
resource "google_storage_bucket" "order_receipts" {
  count = var.enable_production_resources ? 1 : 0

  project                     = var.project_id
  name                        = "${var.project_id}-order-receipts"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  depends_on = [google_project_service.services]
}
