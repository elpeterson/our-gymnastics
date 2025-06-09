# Step 1: Use the official Node.js 18 image as a base
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json to the container
COPY package*.json ./

# Step 4: Install the application dependencies
RUN npm install

# Step 5: Copy the rest of your application code into the container
COPY . .

# Step 6: Compile the TypeScript code into JavaScript
RUN npm run build

# Step 7: Expose the port your server runs on (4000)
EXPOSE 4000

# Step 8: Define the command to run your application
CMD [ "npm", "start" ]