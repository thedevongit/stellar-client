# Use official Node.js 18 image as build environment
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libdbus-1-3 \
    && rm -rf /var/lib/apt/lists/*

# Download and install Stellar CLI
RUN curl -L https://github.com/stellar/stellar-cli/releases/download/v22.7.0/stellar-cli-22.7.0-x86_64-unknown-linux-gnu.tar.gz -o stellar-cli.tar.gz \
    && tar -xzf stellar-cli.tar.gz \
    && mv stellar /usr/local/bin/stellar-cli \
    && chmod 755 /usr/local/bin/stellar-cli \
    && chown root:root /usr/local/bin/stellar-cli \
    && rm stellar-cli.tar.gz

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build the app 
RUN npm run build

# Use a lightweight web server to serve the build (e.g. serve)
FROM node:18-slim AS production
WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy build output from previous stage
COPY --from=build /app/build ./build

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "build", "-l", "3000"]