FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source
RUN npm prune --production && rm -rf src tsconfig.json

# Run as non-root
USER node

CMD ["node", "dist/index.js"]
