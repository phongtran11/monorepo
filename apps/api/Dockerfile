# Stage 1: deps
FROM node:22-alpine AS deps
ARG RAILWAY_ENVIRONMENT
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Stage 2: build
FROM deps AS builder
# Re-declare ARGs in each stage that needs them
ARG RAILWAY_ENVIRONMENT
ARG RAILWAY_SERVICE_NAME
ARG NODE_ENV=production

ENV NODE_ENV=$NODE_ENV

RUN echo "Building for environment: $RAILWAY_ENVIRONMENT, service: $RAILWAY_SERVICE_NAME"

COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

RUN pnpm --filter @lam-thinh-ecommerce/shared build
RUN pnpm --filter @lam-thinh-ecommerce/api build

# Stage 3: runner
FROM node:22-alpine AS runner
ARG NODE_ENV=production
ARG PORT=3000

ENV NODE_ENV=$NODE_ENV
ENV PORT=$PORT


RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE $PORT
CMD ["node", "apps/api/dist/main"]
