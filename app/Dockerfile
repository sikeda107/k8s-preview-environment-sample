FROM node:22-alpine AS base
RUN corepack enable

# deps ステージ: 依存パッケージをインストールする
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# build ステージ: Next.js アプリをビルドする
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# runner ステージ: standalone 出力のみ含む軽量イメージ
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# 非 root ユーザーで実行するためパーミッションを設定する
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# migration Job が node db/migrate.mjs を実行するため db/ をコピーする
COPY --from=build --chown=nextjs:nodejs /app/db ./db

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
