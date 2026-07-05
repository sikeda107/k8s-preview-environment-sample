variable "project_id" {
  description = "Google Cloud プロジェクト ID"
  type        = string
}

variable "region" {
  description = "リソースを作成するリージョン"
  type        = string
  default     = "asia-northeast1"
}

variable "preview_domain" {
  description = "プレビュー環境のベースドメイン ワイルドカード証明書と DNS に使用する"
  type        = string
  default     = "preview.example.com"
}

variable "github_repository" {
  description = "GitHub リポジトリ名 オーナーを含む形式で指定する 例: owner/repo"
  type        = string
  default     = "sikeda107/k8s-preview-environment-sample"
}

variable "artifact_registry_repository_id" {
  description = "Artifact Registry リポジトリ ID workflow の vars.ARTIFACT_REGISTRY_REPOSITORY に対応する"
  type        = string
  default     = "preview"
}

variable "enable_dns" {
  description = "true にすると Cloud DNS ゾーンを作成して DNS レコードを自動設定する false なら手動で DNS 設定が必要"
  type        = bool
  default     = false
}

variable "enable_production_resources" {
  description = "true にすると Cloud Tasks キュー Pub/Sub GCS バケットなど本番用リソースを作成する"
  type        = bool
  default     = false
}

variable "enable_github_variables" {
  description = "true にすると GitHub Repository Variables を Terraform で管理する GitHub provider の認証が必要"
  type        = bool
  default     = false
}

variable "pubsub_push_endpoint" {
  description = "Pub/Sub push サブスクリプションのエンドポイント URL enable_production_resources が true のときに使用する"
  type        = string
  default     = ""

  validation {
    condition     = !var.enable_production_resources || length(var.pubsub_push_endpoint) > 0
    error_message = "enable_production_resources が true のときは pubsub_push_endpoint の指定が必須です"
  }
}
