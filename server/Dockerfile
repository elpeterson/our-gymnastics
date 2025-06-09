# Use a suitable Node.js version as a base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# ---- Monorepo-aware Dependency Installation ----
# 1. Copy all package.json and package-lock.json files from the monorepo root
# The first '.' refers to the monorepo root (the context)
# The second '.' refers to the WORKDIR in the container
COPY ./package.json ./package-lock.json* ./
COPY ./server/package.json ./server/
COPY ./client/package.json ./client/

# 2. Install ALL monorepo dependencies
# This leverages the hoisted node_modules folder for a smaller image
RUN npm install

# ---- Application-specific Build ----
# 3. Copy the server's source code into the WORKDIR
COPY . .

# 4. Run the build script for the server workspace
RUN npm run build --workspace=server

# 5. Expose the port the server listens on
EXPOSE 4000

# 6. Set the command to run the application
CMD [ "npm", "start", "--workspace=server" ]