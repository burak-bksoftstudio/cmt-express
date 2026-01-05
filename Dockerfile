# Build stage
FROM oven/bun:1 AS builder

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY client/package.json client/bun.lock* ./client/

# Install root dependencies
RUN bun install --frozen-lockfile

# Install client dependencies
WORKDIR /app/client
RUN bun install --frozen-lockfile
WORKDIR /app

# Copy prisma schema and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx prisma generate

# Copy client source and build
COPY client ./client
RUN bun run build:client

# Copy server source
COPY src ./src
COPY tsconfig.json ./

# Production stage
FROM oven/bun:1-slim AS production

WORKDIR /app

# Install OpenSSL for Prisma (retry apt-get if it fails)
RUN apt-get update || apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile

# Copy prisma schema and config, then generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx prisma generate

# Copy server source code (Bun runs TypeScript directly)
COPY --from=builder /app/src ./src

# Copy built client files
COPY --from=builder /app/client/dist ./client/dist

# Copy tsconfig for path resolution
COPY tsconfig.json ./

# Expose port
EXPOSE 3000

# Health check using Bun's fetch
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1))" || exit 1

# Start the application directly with TypeScript
CMD ["bun", "src/server.ts"]
