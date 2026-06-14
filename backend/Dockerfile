# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
COPY prisma ./prisma/

# ---- Development ----
FROM base AS development
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---- Builder ----
FROM base AS builder
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate

COPY --from=builder /app/dist ./dist

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser
USER nodeuser

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
