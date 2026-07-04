// ビルド時に DB 接続しようとして失敗するのを防ぐためキャッシュを無効化する
export const dynamic = 'force-dynamic'

import { pool } from '@/lib/db'
import { listReceipts } from '@/lib/storage'
import type { RowDataPacket } from 'mysql2'
import OrderForm from './OrderForm'

interface Order extends RowDataPacket {
  id: number
  product_name: string
  email: string
  status: string
  created_at: string
}

interface OrderEvent extends RowDataPacket {
  id: number
  order_id: number
  event_type: string
  message_id: string | null
  created_at: string
}

async function fetchOrders(): Promise<Order[]> {
  const [rows] = await pool.execute<Order[]>(
    'SELECT id, product_name, email, status, created_at FROM orders ORDER BY id DESC LIMIT 20',
  )
  return rows
}

async function fetchOrderEvents(): Promise<OrderEvent[]> {
  const [rows] = await pool.execute<OrderEvent[]>(
    'SELECT id, order_id, event_type, message_id, created_at FROM order_events ORDER BY id DESC LIMIT 20',
  )
  return rows
}

export default async function Home() {
  let orders: Order[] = []
  let dbError: string | null = null

  let events: OrderEvent[] = []
  let eventsError: string | null = null

  let receipts: { name: string; size: number; updated: string }[] = []
  let receiptsError: string | null = null

  try {
    orders = await fetchOrders()
  } catch {
    dbError = 'DB に接続できませんでした'
  }

  try {
    events = await fetchOrderEvents()
  } catch {
    eventsError = '注文イベントの取得に失敗しました'
  }

  try {
    receipts = await listReceipts()
  } catch {
    receiptsError = '領収書ファイルの取得に失敗しました'
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

      <h2 style={{ marginTop: '2rem' }}>注文イベント (最新20件)</h2>
      {eventsError ? (
        <p className="error">{eventsError}</p>
      ) : events.length === 0 ? (
        <p>イベントはまだありません</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>注文ID</th>
              <th>イベント種別</th>
              <th>メッセージID</th>
              <th>作成日時</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.id}</td>
                <td>{event.order_id}</td>
                <td>{event.event_type}</td>
                <td>{event.message_id ?? '-'}</td>
                <td>{new Date(event.created_at).toLocaleString('ja-JP')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: '2rem' }}>領収書ファイル</h2>
      {receiptsError ? (
        <p className="error">{receiptsError}</p>
      ) : receipts.length === 0 ? (
        <p>領収書ファイルはまだありません</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ファイル名</th>
              <th>サイズ (bytes)</th>
              <th>更新日時</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.name}>
                <td>{receipt.name}</td>
                <td>{receipt.size}</td>
                <td>{receipt.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
