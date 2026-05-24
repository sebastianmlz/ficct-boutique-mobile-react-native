# React Native Expo development sandbox.
# This image runs Metro bundler and exposes ports 19000/19001/19002/8081 so
# host devices can connect via Expo Go. Physical-device development still
# needs the host's tooling for camera/GPS — this container is for typecheck,
# lint, test, and web-bundling reproducibility.
ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM node:${NODE_VERSION} AS dev
WORKDIR /app
ENV NODE_ENV=development
RUN apk add --no-cache git curl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 19000 19001 19002 8081
CMD ["npx", "expo", "start", "--tunnel"]
