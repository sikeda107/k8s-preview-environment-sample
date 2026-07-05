# Certificate Manager によるワイルドカード証明書の発行設定
# k8s 側 Gateway が annotation で preview-cert-map を参照する

# DNS 認証リソース ワイルドカード証明書のドメイン検証に使用する
resource "google_certificate_manager_dns_authorization" "preview" {
  project     = var.project_id
  name        = "preview-dns-auth"
  description = "${var.preview_domain} のワイルドカード証明書用 DNS 認証"
  domain      = var.preview_domain

  depends_on = [google_project_service.services]
}

# ワイルドカード証明書 *.preview_domain と apex ドメインをカバーする
resource "google_certificate_manager_certificate" "preview_wildcard" {
  project     = var.project_id
  name        = "preview-wildcard-cert"
  description = "*.${var.preview_domain} のマネージド証明書"
  scope       = "DEFAULT"

  managed {
    domains = [
      "*.${var.preview_domain}",
      var.preview_domain,
    ]
    dns_authorizations = [
      google_certificate_manager_dns_authorization.preview.id,
    ]
  }
}

# k8s 側 Gateway が annotation networking.gke.io/cert-map で参照する証明書マップ
resource "google_certificate_manager_certificate_map" "preview" {
  project     = var.project_id
  name        = "preview-cert-map"
  description = "プレビュー環境用証明書マップ"
}

# ワイルドカードエントリ *.preview_domain へのリクエストに証明書を適用する
resource "google_certificate_manager_certificate_map_entry" "preview_wildcard" {
  project      = var.project_id
  name         = "preview-wildcard-entry"
  map          = google_certificate_manager_certificate_map.preview.name
  certificates = [google_certificate_manager_certificate.preview_wildcard.id]
  hostname     = "*.${var.preview_domain}"
}

# apex ドメインエントリ
resource "google_certificate_manager_certificate_map_entry" "preview_apex" {
  project      = var.project_id
  name         = "preview-apex-entry"
  map          = google_certificate_manager_certificate_map.preview.name
  certificates = [google_certificate_manager_certificate.preview_wildcard.id]
  hostname     = var.preview_domain
}
