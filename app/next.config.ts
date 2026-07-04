import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@google-cloud/tasks', 'mysql2'],
  // 複数の lockfile が検出される場合に workspace root を明示する
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig
