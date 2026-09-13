FROM node:24.18.0-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ARG COMMERCE_PROVIDER
ARG NEXT_PUBLIC_SITE_URL
ARG PAYLOAD_ECOMMERCE_URL
ARG PAYLOAD_CMS_URL
ARG NEXT_PUBLIC_CMS_URL
ARG CMS_MEDIA_ORIGIN
ENV NEXT_TELEMETRY_DISABLED=1 \
    STANDALONE_OUTPUT=true \
    COMMERCE_PROVIDER=$COMMERCE_PROVIDER \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    PAYLOAD_ECOMMERCE_URL=$PAYLOAD_ECOMMERCE_URL \
    PAYLOAD_CMS_URL=$PAYLOAD_CMS_URL \
    NEXT_PUBLIC_CMS_URL=$NEXT_PUBLIC_CMS_URL \
    CMS_MEDIA_ORIGIN=$CMS_MEDIA_ORIGIN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:web

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
