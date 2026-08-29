# Multi-stage build for OmniBug
FROM node:20-alpine AS builder

WORKDIR /app

# Install root & workspace dependencies
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm install --prefix backend && npm install --prefix frontend

# Copy all source files
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY scripts/ ./scripts/

# Build backend and frontend
RUN npm run --prefix backend build
RUN npm run --prefix frontend build

# Final runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json ./
COPY backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY scripts/ ./scripts/

EXPOSE 4000

CMD ["node", "backend/dist/server.js"]
