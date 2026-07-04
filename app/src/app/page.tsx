// ビルド時に DB 接続しようとして失敗するのを防ぐためキャッシュを無効化する
export const dynamic = 'force-dynamic'

import { pool } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'
import OrderForm from './OrderForm'

interface Order extends RowDataPacket {
  id: number
  product_name: string
  email: string
  status: string
  created_at: string
}

async function fetchOrders(): Promise<Order[]> {
  const [rows] = await pool.execute<Order[]>(
    'SELECT id, product_name, email, status, created_at FROM orders ORDER BY id DESC LIMIT 20',
  )
  return rows
}

export default async function Home() {
  let orders: Order[] = []
  let dbError: string | null = null

  try {
    orders = await fetchOrders()
  } catch {
    dbError = 'DB に接続できませんでした'
  }

  return (
    <main>
      <h1>注文管理</h1>

      <h2>新規注文</h2>
      <OrderForm />

      <h2 style={{ marginTop: '2rem' }}>注文一覧 (最新20件)</h2>
      {dbError ? (
        <p className="error">{dbError}</p>
      ) : orders.length === 0 ? (
        <p>注文はまだありません</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>商品名</th>
              <th>メール</th>
              <th>ステータス</th>
              <th>作成日時</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.product_name}</td>
                <td>{order.email}</td>
                <td>{order.status}</td>
                <td>{new Date(order.created_at).toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
