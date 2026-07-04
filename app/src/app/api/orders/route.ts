import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { enqueueSendEmailTask } from '@/lib/cloud-tasks'
import type { ResultSetHeader } from 'mysql2'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { productName, email } = body as Record<string, unknown>
  if (!productName || typeof productName !== 'string') {
    return NextResponse.json({ error: 'productName is required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO orders (product_name, email, status) VALUES (?, ?, ?)',
      [productName, email, 'pending'],
    )
    const orderId = result.insertId

    await enqueueSendEmailTask({ orderId })

    return NextResponse.json({ orderId }, { status: 202 })
  } catch (err) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
