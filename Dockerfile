# Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend deps
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

# Runtime (single container)
FROM node:22-alpine
WORKDIR /app
COPY --from=backend-builder /app/backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend-dist
ENV PORT=3100
EXPOSE 3100
CMD ["node", "backend/src/server.js"]
