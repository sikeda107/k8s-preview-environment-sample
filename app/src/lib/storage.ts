import { Storage } from '@google-cloud/storage'

// dev のホットリロードでクライアントが増殖しないよう globalThis にキャッシュする
const globalForStorage = globalThis as typeof globalThis & {
  storageClient?: Storage
  ensureBucketPromise?: Promise<void>
}

function createClient(): Storage {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? 'local-project'
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST
  if (emulatorHost) {
    // STORAGE_EMULATOR_HOST 直接利用では /storage/v1 が付かないため退避して apiEndpoint で渡す
    delete process.env.STORAGE_EMULATOR_HOST
    const client = new Storage({ projectId, apiEndpoint: emulatorHost })
    process.env.STORAGE_EMULATOR_HOST = emulatorHost
    return client
  }
  return new Storage({ projectId })
}

export const storageClient: Storage =
  globalForStorage.storageClient ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForStorage.storageClient = storageClient
}

function getBucketName(): string {
  return process.env.CLOUD_STORAGE_BUCKET ?? 'order-receipts'
}

// エミュレーター利用時のみ bucket を作成し並行呼び出しでも一度だけ実行する
async function ensureBucket(): Promise<void> {
  if (!process.env.STORAGE_EMULATOR_HOST) return

  if (!globalForStorage.ensureBucketPromise) {
    globalForStorage.ensureBucketPromise = (async () => {
      try {
        await storageClient.createBucket(getBucketName())
      } catch (err: unknown) {
        // HTTP 409 は bucket が既に存在するため無視する
        const e = err as { code?: number }
        if (e?.code !== 409) throw err
      }
    })()
  }

  return globalForStorage.ensureBucketPromise
}

export async function uploadReceipt(
  orderId: number,
  content: string,
): Promise<void> {
  await ensureBucket()
  const file = storageClient
    .bucket(getBucketName())
    .file(`receipts/order-${orderId}.txt`)
  // fake-gcs-server は resumable アップロードと相性が悪いため resumable: false を指定する
  await file.save(content, { resumable: false })
}

export async function listReceipts(): Promise<
  { name: string; size: number; updated: string }[]
> {
  await ensureBucket()
  const [files] = await storageClient
    .bucket(getBucketName())
    .getFiles({ prefix: 'receipts/', maxResults: 20 })
  return files.map((f) => ({
    name: f.name,
    size: Number(f.metadata.size ?? 0),
    updated: String(f.metadata.updated ?? ''),
  }))
}
