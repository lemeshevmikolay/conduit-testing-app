FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY backend ./backend
COPY frontend ./frontend
COPY docs ./docs
RUN npm run build --workspace frontend && npm prune --omit=dev

WORKDIR /app/backend
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["node", "index.js"]
