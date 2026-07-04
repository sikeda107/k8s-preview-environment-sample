import { CloudTasksClient } from '@google-cloud/tasks'
// tasks 内部と同一の grpc インスタンスを使い ChannelCredentials の instanceof 不一致を防ぐ
import { grpc } from 'google-gax'

// エミュレーターホストが設定されている場合は非 TLS で接続する
function createClient(): CloudTasksClient {
  const emulatorHost = process.env.CLOUD_TASKS_EMULATOR_HOST
  if (!emulatorHost) {
    return new CloudTasksClient()
  }
  const [servicePath, portStr] = emulatorHost.split(':')
  const port = portStr ? Number(portStr) : 8123
  return new CloudTasksClient({
    servicePath,
    port,
    sslCreds: grpc.credentials.createInsecure(),
  })
}

const globalForTasks = globalThis as typeof globalThis & {
  tasksClient?: CloudTasksClient
  ensureQueuePromise?: Promise<void>
}

export const tasksClient: CloudTasksClient =
  globalForTasks.tasksClient ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForTasks.tasksClient = tasksClient
}

function getQueuePath(): string {
  const project = process.env.GOOGLE_CLOUD_PROJECT ?? 'local-project'
  const location = process.env.CLOUD_TASKS_LOCATION ?? 'asia-northeast1'
  const queue = process.env.CLOUD_TASKS_QUEUE ?? 'send-email'
  return tasksClient.queuePath(project, location, queue)
}

// エミュレーター利用時のみキューを作成し並行呼び出しでも一度だけ実行する
async function ensureQueue(): Promise<void> {
  const emulatorHost = process.env.CLOUD_TASKS_EMULATOR_HOST
  if (!emulatorHost) return

  if (!globalForTasks.ensureQueuePromise) {
    globalForTasks.ensureQueuePromise = (async () => {
      const project = process.env.GOOGLE_CLOUD_PROJECT ?? 'local-project'
      const location = process.env.CLOUD_TASKS_LOCATION ?? 'asia-northeast1'
      const parent = tasksClient.locationPath(project, location)
      try {
        await tasksClient.createQueue({ parent, queue: { name: getQueuePath() } })
      } catch (err: unknown) {
        // gRPC エラーコード 6 は ALREADY_EXISTS なので無視する
        const e = err as { code?: number }
        if (e?.code !== 6) throw err
      }
    })()
  }

  return globalForTasks.ensureQueuePromise
}

export async function enqueueSendEmailTask(payload: {
  orderId: number
}): Promise<void> {
  await ensureQueue()

  const baseUrl = process.env.TASK_HANDLER_BASE_URL ?? 'http://localhost:3000'
  const url = `${baseUrl}/api/tasks/send-email`
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')

  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL

  await tasksClient.createTask({
    parent: getQueuePath(),
    task: {
      httpRequest: {
        url,
        httpMethod: 'POST' as const,
        headers: { 'Content-Type': 'application/json' },
        body,
        // 本番環境でハンドラーへの OIDC 認証が必要な場合のみ設定する
        ...(serviceAccountEmail
          ? { oidcToken: { serviceAccountEmail } }
          : {}),
      },
    },
  })
}
