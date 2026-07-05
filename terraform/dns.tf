# enable_dns が true のときのみ Cloud DNS ゾーンとレコードを作成する
# false の場合は outputs.tf で CNAME 値を出力するので手動で DNS 設定を行う

# Cloud DNS ゾーンを新規作成する enable_dns が true のときのみ
resource "google_dns_managed_zone" "preview" {
  count = var.enable_dns ? 1 : 0

  project     = var.project_id
  name        = "preview-zone"
  dns_name    = "${var.preview_domain}."
  description = "${var.preview_domain} 用 Cloud DNS マネージドゾーン"

  depends_on = [google_project_service.services]
}

# Certificate Manager DNS 認証用の CNAME レコード enable_dns が true のときのみ自動作成する
resource "google_dns_record_set" "cert_dns_auth" {
  count = var.enable_dns ? 1 : 0

  project      = var.project_id
  managed_zone = google_dns_managed_zone.preview[0].name
  name         = google_certificate_manager_dns_authorization.preview.dns_resource_record[0].name
  type         = google_certificate_manager_dns_authorization.preview.dns_resource_record[0].type
  ttl          = 300
  rrdatas      = [google_certificate_manager_dns_authorization.preview.dns_resource_record[0].data]
}

# ワイルドカード A レコード LB IP に向ける enable_dns が true のときのみ
resource "google_dns_record_set" "preview_wildcard" {
  count = var.enable_dns ? 1 : 0

  project      = var.project_id
  managed_zone = google_dns_managed_zone.preview[0].name
  name         = "*.${var.preview_domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.preview_gateway.address]
}

# apex ドメインの A レコード enable_dns が true のときのみ
resource "google_dns_record_set" "preview_apex" {
  count = var.enable_dns ? 1 : 0

  project      = var.project_id
  managed_zone = google_dns_managed_zone.preview[0].name
  name         = "${var.preview_domain}."
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.preview_gateway.address]
}
