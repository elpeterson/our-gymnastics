# Stage 1: Install dependencies and build the application
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy all package manifests to leverage Docker cache
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all monorepo dependencies
RUN npm ci

# Copy the client source code
COPY client/ ./client/

# Build the Next.js application
RUN npm run build --workspace=client

# Stage 2: Create the final production image
FROM node:20-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production for the leanest possible image
ENV NODE_ENV=production

# Copy the built application from the 'builder' stage
COPY --from=builder /app/client/.next/standalone ./
COPY --from=builder /app/client/.next/static ./client/.next/static
COPY --from=builder /app/client/public ./client/public

# Expose the port Next.js runs on
EXPOSE 3000

# Command to start the server
CMD ["node", "client/server.js"]