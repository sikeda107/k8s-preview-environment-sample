import { pool } from '@/lib/db'
import { enqueueSendEmailTask } from '@/lib/cloud-tasks'
import { publishOrderCreatedEvent } from '@/lib/pubsub'
import type { ResultSetHeader } from 'mysql2'

// 注文を登録しメール送信タスクの投入とイベント発行まで行うドメインロジック
export async function createOrder(input: {
  productName: string
  email: string
}): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    'INSERT INTO orders (product_name, email, status) VALUES (?, ?, ?)',
    [input.productName, input.email, 'pending'],
  )
  const orderId = result.insertId

  await enqueueSendEmailTask({ orderId })
  await publishOrderCreatedEvent({ orderId })

  return orderId
}
