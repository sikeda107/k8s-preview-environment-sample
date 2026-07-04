'use server'

import { revalidatePath } from 'next/cache'
import { createOrder } from '@/lib/orders'

export type OrderFormState = { success?: string; error?: string } | null

// フォーム送信から注文作成までを行い結果メッセージを返す Server Action
export async function createOrderAction(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const productName = formData.get('productName')
  if (!productName || typeof productName !== 'string') {
    return { error: '商品名を入力してください' }
  }
  const email = formData.get('email')
  if (!email || typeof email !== 'string') {
    return { error: 'メールアドレスを入力してください' }
  }

  try {
    const orderId = await createOrder({ productName, email })
    revalidatePath('/')
    return { success: `注文を受け付けました orderId: ${orderId}` }
  } catch (err) {
    console.error('createOrderAction error:', err)
    return { error: '注文の処理中にエラーが発生しました' }
  }
}
