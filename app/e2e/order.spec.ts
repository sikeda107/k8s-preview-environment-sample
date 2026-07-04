import { test, expect } from '@playwright/test'

// 起動済みの Preview 環境に対して注文フローを E2E 検証する
// 事前に対象環境へ port-forward し E2E_BASE_URL を指定する

test('healthz が ok を返す', async ({ request }) => {
  const res = await request.get('/api/healthz')
  expect(res.status()).toBe(200)
  expect(await res.json()).toEqual({ ok: true })
})

test('注文作成から email_sent と領収書までが通る', async ({ page, request }) => {
  // 一覧で自分の注文を特定できるよう一意な商品名を使う
  const productName = `E2E-${Date.now()}`
  const email = 'e2e@example.com'

  // 注文を作成する Cloud Tasks へメール送信タスクが積まれる
  const res = await request.post('/api/orders', {
    data: { productName, email },
  })
  expect(res.status()).toBe(202)
  const { orderId } = (await res.json()) as { orderId: number }
  expect(orderId).toBeGreaterThan(0)

  // 非同期ハンドラーが完了しステータスが email_sent になるまで再読込して待つ
  await expect(async () => {
    await page.goto('/')
    const row = page.getByRole('row').filter({ hasText: productName })
    await expect(row).toContainText('email_sent')
  }).toPass({ timeout: 60_000, intervals: [2_000] })

  // Cloud Storage エミュレーターに領収書が保存されている
  const receiptRow = page
    .getByRole('row')
    .filter({ hasText: `receipts/order-${orderId}.txt` })
  await expect(receiptRow).toBeVisible()
})
