# enable_github_variables が true のときのみ GitHub Repository Variables を管理する
# GitHub provider の認証が必要 GITHUB_TOKEN 環境変数または provider の token 引数で設定する

locals {
  repo_name = split("/", var.github_repository)[1]
}

# Google Cloud プロジェクト ID を Repository Variable に設定する
resource "github_actions_variable" "google_cloud_project_id" {
  count = var.enable_github_variables ? 1 : 0

  repository    = local.repo_name
  variable_name = "GOOGLE_CLOUD_PROJECT_ID"
  value         = var.project_id
}

# Artifact Registry リポジトリ名を Repository Variable に設定する
resource "github_actions_variable" "artifact_registry_repository" {
  count = var.enable_github_variables ? 1 : 0

  repository    = local.repo_name
  variable_name = "ARTIFACT_REGISTRY_REPOSITORY"
  value         = var.artifact_registry_repository_id
}

# CI 用サービスアカウントのメールアドレスを Repository Variable に設定する
resource "github_actions_variable" "google_cloud_service_account" {
  count = var.enable_github_variables ? 1 : 0

  repository    = local.repo_name
  variable_name = "GOOGLE_CLOUD_SERVICE_ACCOUNT"
  value         = google_service_account.github_actions.email
}

# Workload Identity Provider のリソース名を Repository Variable に設定する
resource "github_actions_variable" "workload_identity_provider" {
  count = var.enable_github_variables ? 1 : 0

  repository    = local.repo_name
  variable_name = "WORKLOAD_IDENTITY_PROVIDER"
  value         = google_iam_workload_identity_pool_provider.github.name
}
