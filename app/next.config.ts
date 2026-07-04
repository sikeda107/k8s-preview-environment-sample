import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  output: 'standalone',
  // google-gax も外部化しバンドルによる grpc インスタンスの二重化を防ぐ
  serverExternalPackages: [
    '@google-cloud/tasks',
    '@google-cloud/pubsub',
    '@google-cloud/storage',
    'google-gax',
    'mysql2',
  ],
  // 複数の lockfile が検出される場合に workspace root を明示する
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig
