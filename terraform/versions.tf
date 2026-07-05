terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.39"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.12"
    }
  }

  # ローカル state をデフォルトとして使用する
  # 本番運用時は以下のブロックのコメントを外して Google Cloud Storage backend を使う
  # backend "gcs" {
  #   bucket = "<your-tfstate-bucket>"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# enable_github_variables が true のときのみ GitHub provider が必要
# GitHub personal access token または GITHUB_TOKEN 環境変数で認証する
provider "github" {
  owner = split("/", var.github_repository)[0]
}
