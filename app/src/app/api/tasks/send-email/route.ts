import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { uploadReceipt } from '@/lib/storage'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

// Cloud Tasks はハンドラーが 2xx 以外を返すとタスクをリトライするため 404 と 500 を適切に返す
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { orderId } = body as Record<string, unknown>
  if (!orderId || typeof orderId !== 'number') {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM orders WHERE id = ?',
      [orderId],
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // 実際のメール送信は行わずログ出力のみとする
    console.log(`[send-email] Sending email for orderId=${orderId}`)

    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE orders SET status = 'email_sent' WHERE id = ?",
      [orderId],
    )
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const receiptContent = [
      `領収書`,
      `注文ID: ${orderId}`,
      `ステータス: email_sent`,
      `発行日時: ${new Date().toISOString()}`,
    ].join('\n')
    await uploadReceipt(orderId, receiptContent)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/tasks/send-email error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
