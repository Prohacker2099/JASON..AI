# Use Node.js 20 Alpine
FROM node:20-alpine

# Install Chromium for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer/Playwright to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including Playwright)
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port (Fly.io will set PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the app
CMD ["npm", "start"]
