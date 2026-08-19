FROM node:24-bookworm-slim

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY config ./config
COPY data ./data
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
COPY tests ./tests
COPY next.config.mjs prisma.config.ts tsconfig.json ./
COPY deploy/p1-23/run-verification.mjs ./deploy/p1-23/run-verification.mjs

# This build-time value is intentionally non-secret. The Cloud Run Job replaces
# it with the Secret Manager-injected test URL at execution time.
ENV APP_ENV=test \
    NODE_ENV=test \
    DATABASE_URL=postgresql://synthetic:synthetic@127.0.0.1:5432/schoolbanchee_test \
    NEXTAUTH_URL=https://p1-23.invalid \
    NEXTAUTH_SECRET=0123456789abcdef0123456789abcdef \
    SCHOOL_SEED_ESAO_CODE=1000960001

RUN npx prisma generate

CMD ["node", "deploy/p1-23/run-verification.mjs"]
