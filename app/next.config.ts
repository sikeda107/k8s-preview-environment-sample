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
  // 動的 require される JSON や CJS ビルドの欠落を防ぐため外部化パッケージ全体を含める
  outputFileTracingIncludes: {
    '/api/**': [
      './node_modules/@google-cloud/tasks/build/**',
      './node_modules/@google-cloud/pubsub/build/**',
      './node_modules/@google-cloud/storage/build/**',
      './node_modules/fast-xml-parser/**',
      './node_modules/html-entities/**',
      './node_modules/mysql2/**',
    ],
  },
}

export default nextConfig
