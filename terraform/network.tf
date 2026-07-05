# GKE Gateway が NamedAddress で参照するグローバル静的 IP アドレス
resource "google_compute_global_address" "preview_gateway" {
  project = var.project_id
  name    = "preview-gateway-ip"

  depends_on = [google_project_service.services]
}
