'use client'

import { useActionState } from 'react'
import { createOrderAction } from './actions'

// React 19 の useActionState と Server Action によるフォーム実装のサンプル
export default function OrderForm() {
  const [state, formAction, isPending] = useActionState(createOrderAction, null)

  return (
    <form action={formAction}>
      <label>
        商品名
        <input
          type="text"
          name="productName"
          required
          placeholder="例: Widget A"
        />
      </label>
      <label>
        メールアドレス
        <input
          type="email"
          name="email"
          required
          placeholder="user@example.com"
        />
      </label>
      <button type="submit" disabled={isPending}>
        {isPending ? '送信中...' : '注文する'}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">{state.success}</p>}
    </form>
  )
}
