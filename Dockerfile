# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and lockfile
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js application
RUN pnpm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

ENV NODE_ENV=production

# Copy built assets and dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.database.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/database ./database
COPY --from=builder /app/seeds ./seeds
COPY --from=builder /app/lib ./lib

EXPOSE 3000

CMD ["pnpm", "start"]
