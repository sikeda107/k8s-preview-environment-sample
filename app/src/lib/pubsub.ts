import { PubSub } from '@google-cloud/pubsub'

// dev のホットリロードでクライアントが増殖しないよう globalThis にキャッシュする
const globalForPubSub = globalThis as typeof globalThis & {
  pubSubClient?: PubSub
  ensureTopicPromise?: Promise<void>
}

function createClient(): PubSub {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? 'local-project'
  // PUBSUB_EMULATOR_HOST は @google-cloud/pubsub がネイティブに解釈するため特別な設定は不要
  return new PubSub({ projectId })
}

export const pubSubClient: PubSub =
  globalForPubSub.pubSubClient ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPubSub.pubSubClient = pubSubClient
}

function getTopicName(): string {
  return process.env.PUBSUB_TOPIC ?? 'order-events'
}

function getSubscriptionName(): string {
  return process.env.PUBSUB_PUSH_SUBSCRIPTION ?? 'order-events-push'
}

// エミュレーター利用時のみ topic と push サブスクリプションを作成し並行呼び出しでも一度だけ実行する
async function ensureTopicAndPushSubscription(): Promise<void> {
  if (!process.env.PUBSUB_EMULATOR_HOST) return

  if (!globalForPubSub.ensureTopicPromise) {
    globalForPubSub.ensureTopicPromise = (async () => {
      const topicName = getTopicName()
      const subscriptionName = getSubscriptionName()
      const baseUrl =
        process.env.TASK_HANDLER_BASE_URL ?? 'http://localhost:3000'
      const pushEndpoint = `${baseUrl}/api/pubsub/order-created`

      try {
        await pubSubClient.createTopic(topicName)
      } catch (err: unknown) {
        // gRPC エラーコード 6 は ALREADY_EXISTS なので無視する
        const e = err as { code?: number }
        if (e?.code !== 6) throw err
      }

      try {
        await pubSubClient
          .topic(topicName)
          .createSubscription(subscriptionName, {
            pushConfig: { pushEndpoint },
          })
      } catch (err: unknown) {
        // gRPC エラーコード 6 は ALREADY_EXISTS なので無視する
        const e = err as { code?: number }
        if (e?.code !== 6) throw err
      }
    })()
  }

  return globalForPubSub.ensureTopicPromise
}

export async function publishOrderCreatedEvent(payload: {
  orderId: number
}): Promise<void> {
  await ensureTopicAndPushSubscription()
  const data = Buffer.from(JSON.stringify(payload))
  await pubSubClient.topic(getTopicName()).publish(data)
}
