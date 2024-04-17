# Use the official Node.js 14 image as base
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Create public directory and grant write access
RUN mkdir -p public/temp && chmod -R 777 public

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Command to run your application
CMD ["node", "src/index.js"]
