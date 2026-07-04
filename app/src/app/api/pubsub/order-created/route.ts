import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import type { ResultSetHeader } from 'mysql2'

// Pub/Sub はハンドラーが 2xx 以外を返すとメッセージをリトライするため適切なステータスを返す
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, subscription } = body as Record<string, unknown>
  if (
    !message ||
    typeof message !== 'object' ||
    !subscription ||
    typeof subscription !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid push payload' }, { status: 400 })
  }

  const { data, messageId } = message as Record<string, unknown>
  if (!data || typeof data !== 'string') {
    return NextResponse.json(
      { error: 'message.data is required' },
      { status: 400 },
    )
  }

  let payload: { orderId?: unknown }
  try {
    payload = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
  } catch {
    return NextResponse.json(
      { error: 'Failed to decode message data' },
      { status: 400 },
    )
  }

  const { orderId } = payload
  if (!orderId || typeof orderId !== 'number') {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  try {
    const msgId =
      messageId && typeof messageId === 'string' ? messageId : null
    await pool.execute<ResultSetHeader>(
      'INSERT INTO order_events (order_id, event_type, message_id) VALUES (?, ?, ?)',
      [orderId, 'order_created', msgId],
    )

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('POST /api/pubsub/order-created error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
