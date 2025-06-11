# ===== Builder Stage =====
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/

RUN npm ci

COPY server/ ./server/

RUN npm run build:server

# ===== Runner Stage =====
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# --- Add ARG for each secret ---
ARG DB_USER
ARG DB_HOST
ARG DB_DATABASE
ARG DB_PASSWORD
ARG DB_PORT

# --- Expose ARG as ENV inside the container ---
ENV DB_USER=$DB_USER
ENV DB_HOST=$DB_HOST
ENV DB_DATABASE=$DB_DATABASE
ENV DB_PASSWORD=$DB_PASSWORD
ENV DB_PORT=$DB_PORT

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/server/package.json ./server/
RUN npm install --production --prefix server

EXPOSE 4000
CMD ["npm", "start", "--workspace=server" ]
