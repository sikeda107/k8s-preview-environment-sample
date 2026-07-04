'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrderForm() {
  const router = useRouter()
  const [productName, setProductName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, email }),
      })
      const data = (await res.json()) as { orderId?: number; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'エラーが発生しました')
        return
      }
      setSuccess(`注文を受け付けました (orderId: ${data.orderId})`)
      setProductName('')
      setEmail('')
      router.refresh()
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        商品名
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
          placeholder="例: Widget A"
        />
      </label>
      <label>
        メールアドレス
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="user@example.com"
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? '送信中...' : '注文する'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </form>
  )
}
