# ===== Builder Stage =====
# This stage installs dependencies and builds the Next.js application.
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json from the root and the client directory
# The GitHub workflow builds from the root, so we need to specify the 'client' path
COPY package.json package-lock.json ./
COPY client/package.json ./client/

# Use 'npm ci' for reliable CI builds
RUN npm ci

# Copy the client application source code
COPY client/ ./client/

# Build the Next.js application for production
RUN npm run build:client

# ===== Runner Stage =====
# This stage creates the final, lightweight image with only the built app
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# --- Add ARG for each secret ---
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy the built Next.js app from the builder stage
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public

# Copy the package manifests to the runner stage
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/client/package.json ./client/

# Install only the production dependencies to keep the image small
RUN npm install --production

# Expose port 3000 to allow traffic to the application
EXPOSE 3000

# Use '--prefix client' to run the start command from the client's package.json
CMD ["npm", "start", "--workspace=client" ]