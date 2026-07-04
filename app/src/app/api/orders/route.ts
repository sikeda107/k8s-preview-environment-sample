import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/orders'

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
    const orderId = await createOrder({ productName, email })
    return NextResponse.json({ orderId }, { status: 202 })
  } catch (err) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
