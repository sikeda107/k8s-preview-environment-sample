import { defineConfig } from '@playwright/test'

// 起動済みの環境に対して E2E を実行する webServer は使わない
// port-forward 済みの kind か GKE の Preview URL を E2E_BASE_URL で指定する
export default defineConfig({
  testDir: './e2e',
  // 非同期処理の完了待ちがあるため1テストの上限を長めに取る
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:18080',
    trace: 'on-first-retry',
  },
})
