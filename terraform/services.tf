# 必要な Google Cloud API を有効化する
# disable_on_destroy を false にして terraform destroy でも API を無効化しないようにする

locals {
  # 常に有効化が必要な API 一覧
  base_services = [
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "certificatemanager.googleapis.com",
    "compute.googleapis.com",
  ]

  # enable_production_resources が true のときのみ有効化する API 一覧
  production_services = var.enable_production_resources ? [
    "cloudtasks.googleapis.com",
    "pubsub.googleapis.com",
    "storage.googleapis.com",
  ] : []

  all_services = concat(local.base_services, local.production_services)
}

resource "google_project_service" "services" {
  for_each = toset(local.all_services)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
