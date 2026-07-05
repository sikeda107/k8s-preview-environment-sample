output "workload_identity_provider" {
  description = "Workload Identity Provider のフルリソース名 WORKLOAD_IDENTITY_PROVIDER に設定する"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "service_account_email" {
  description = "CI 用サービスアカウントのメールアドレス GOOGLE_CLOUD_SERVICE_ACCOUNT に設定する"
  value       = google_service_account.github_actions.email
}

output "artifact_registry_url" {
  description = "Artifact Registry リポジトリの URL イメージ push 先として使用する"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_registry_repository_id}"
}

output "static_ip_address" {
  description = "Gateway 用グローバル静的 IP アドレス DNS の A レコードに設定する"
  value       = google_compute_global_address.preview_gateway.address
}

output "certificate_map_name" {
  description = "Certificate Manager の証明書マップ名 GKE Gateway の annotation に設定する"
  value       = google_certificate_manager_certificate_map.preview.name
}

# enable_dns が false のときは以下の CNAME を手動で DNS プロバイダに設定する必要がある
output "dns_auth_cname_name" {
  description = "Certificate Manager DNS 認証用 CNAME レコードのホスト名 enable_dns が false のとき手動設定が必要"
  value       = google_certificate_manager_dns_authorization.preview.dns_resource_record[0].name
}

output "dns_auth_cname_value" {
  description = "Certificate Manager DNS 認証用 CNAME レコードの値 enable_dns が false のとき手動設定が必要"
  value       = google_certificate_manager_dns_authorization.preview.dns_resource_record[0].data
}
