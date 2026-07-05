# Artifact Registry リポジトリ nextjs イメージを push するために使用する
resource "google_artifact_registry_repository" "preview" {
  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_registry_repository_id
  description   = "Preview environment container images"
  format        = "DOCKER"

  depends_on = [google_project_service.services]
}
