FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY src ./src

# Build
RUN npm run build

# Remove dev dependencies and source
RUN npm prune --production && rm -rf src tsconfig.json

# Run as non-root
USER node

CMD ["node", "dist/index.js"]
