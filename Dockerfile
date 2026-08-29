# Oppenheimer E-Commerce Platform
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/dist ./dist
RUN npm ci --omit=dev
EXPOSE 5000
CMD ["node", "server/dist/server/src/server.js"]
