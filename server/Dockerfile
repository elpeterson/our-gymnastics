# CORRECTED: Use the 'slim' variant for better compatibility
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy all package manifests to leverage Docker cache
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# CORRECTED: Use 'npm ci' for reliable CI builds
RUN npm ci

# Copy only the server's source code
COPY server/ ./server/

# Build the server application
RUN npm run build --workspace=server

EXPOSE 4000

# The start script in server/package.json runs the compiled code from dist/
CMD [ "npm", "start", "--workspace=server" ]