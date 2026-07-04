FROM node:22-alpine AS base
RUN corepack enable

# prod-deps ステージ: 本番依存のみを pnpm 標準レイアウトでインストールする
FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# deps ステージ: ビルドに必要な全依存パッケージをインストールする
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

# runner ステージ: standalone 出力と本番依存のみ含む軽量イメージ
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# 非 root ユーザーで実行するためパーミッションを設定する
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# tracing された node_modules はレイヤー肥大を避けるため最初からコピーせず選択コピーする
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone/server.js ./server.js
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone/package.json ./package.json
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone/.next ./.next

# node_modules は Next の tracing に依存せず pnpm の prod install 成果物を同梱する
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# migration Job が node db/migrate.mjs を実行するため db/ をコピーする
COPY --from=build --chown=nextjs:nodejs /app/db ./db

# runAsNonRoot の検証は数値 UID でしか行えないため数値で指定する
USER 1001

EXPOSE 3000
CMD ["node", "server.js"]
