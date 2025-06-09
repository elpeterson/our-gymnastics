# Use a suitable Node.js version as a base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy all package manifests to leverage Docker cache
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all monorepo dependencies
RUN npm install

# Copy only the server's source code
# This copies the content of your local `server` directory
# into a `server` directory inside the Docker image's WORKDIR.
COPY server/ ./server/

# Build the server application
RUN npm run build --workspace=server

EXPOSE 4000

# The start script in server/package.json runs the compiled code from dist/
CMD [ "npm", "start", "--workspace=server" ]