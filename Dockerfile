# ===== Етап 1: збірка фронтенду =====
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ===== Етап 2: легкий образ для роботи =====
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY shared ./shared
COPY server ./server
COPY --from=builder /app/dist ./dist
EXPOSE 3002
CMD ["npm", "run", "start:prod"]
