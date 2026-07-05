# terraform

k8s-preview-environment-sample が必要とする Google Cloud リソースを Terraform で管理するディレクトリ

---

## ファイル構成

| ファイル | 内容 |
|---|---|
| `versions.tf` | terraform と provider のバージョン制約 backend 設定例 |
| `variables.tf` | 入力変数の定義 |
| `services.tf` | 必要な Google Cloud API の有効化 |
| `artifact-registry.tf` | Artifact Registry リポジトリ |
| `workload-identity.tf` | Workload Identity Pool / Provider / サービスアカウント |
| `network.tf` | グローバル静的 IP アドレス (preview-gateway-ip) |
| `certificate.tf` | Certificate Manager 証明書マップ一式 (preview-cert-map) |
| `dns.tf` | Cloud DNS ゾーンとレコード (enable_dns=true のときのみ) |
| `production.tf` | Cloud Tasks / Pub/Sub / GCS バケット (enable_production_resources=true のときのみ) |
| `github.tf` | GitHub Repository Variables (enable_github_variables=true のときのみ) |
| `outputs.tf` | 他リソースや手動設定に必要な値の出力 |
| `terraform.tfvars.example` | 変数ファイルのサンプル |

---

## 変数一覧

| 変数名 | デフォルト | 必須 | 説明 |
|---|---|---|---|
| `project_id` | なし | はい | Google Cloud プロジェクト ID |
| `region` | `asia-northeast1` | いいえ | リソースを作成するリージョン |
| `preview_domain` | `preview.example.com` | いいえ | プレビュー環境のベースドメイン |
| `github_repository` | `sikeda107/k8s-preview-environment-sample` | いいえ | GitHub リポジトリ名 (owner/repo 形式) |
| `artifact_registry_repository_id` | `preview` | いいえ | Artifact Registry リポジトリ ID |
| `enable_dns` | `false` | いいえ | Cloud DNS ゾーンを作成するかどうか |
| `enable_production_resources` | `false` | いいえ | 本番用リソースを作成するかどうか |
| `enable_github_variables` | `false` | いいえ | GitHub Repository Variables を管理するかどうか |
| `pubsub_push_endpoint` | `""` | 条件付き | Pub/Sub push のエンドポイント URL (enable_production_resources=true 時は必須) |

---

## 適用順と手順

### 1. 変数ファイルの準備

```bash
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集して project_id など必要な値を設定する
```

### 2. 初期化

```bash
terraform init
```

### 3. 基本リソースの適用 (フラグ全て false のデフォルト状態)

Artifact Registry / WIF / 静的 IP / Certificate Manager を作成する

```bash
terraform apply
```

### 4. DNS の設定 (2 択)

**a) Cloud DNS を Terraform で管理する場合**

```hcl
enable_dns = true
```

```bash
terraform apply
```

**b) 外部 DNS プロバイダを使う場合**

apply 後に出力される値を手動で DNS プロバイダに登録する

```bash
terraform output dns_auth_cname_name   # CNAME レコードのホスト名
terraform output dns_auth_cname_value  # CNAME レコードの値
terraform output static_ip_address     # *.preview_domain 向け A レコードの値
```

### 5. 本番用リソースの適用 (任意)

```hcl
enable_production_resources = true
pubsub_push_endpoint        = "https://your-domain/api/pubsub/order-created"
```

```bash
terraform apply
```

### 6. GitHub Repository Variables の設定 (任意)

```hcl
enable_github_variables = true
```

GITHUB_TOKEN 環境変数に Personal Access Token を設定してから apply する

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
terraform apply
```

---

## 出力値

| 出力名 | 説明 |
|---|---|
| `workload_identity_provider` | WORKLOAD_IDENTITY_PROVIDER に設定するリソース名 |
| `service_account_email` | GOOGLE_CLOUD_SERVICE_ACCOUNT に設定するメールアドレス |
| `artifact_registry_url` | イメージ push 先 URL |
| `static_ip_address` | DNS A レコードに設定する IP アドレス |
| `certificate_map_name` | GKE Gateway の annotation に設定する証明書マップ名 |
| `dns_auth_cname_name` | DNS 認証用 CNAME のホスト名 (enable_dns=false 時に手動設定) |
| `dns_auth_cname_value` | DNS 認証用 CNAME の値 (enable_dns=false 時に手動設定) |
