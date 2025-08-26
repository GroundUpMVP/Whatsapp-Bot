FROM oven/bun:latest

# Install chromium
RUN apt-get update && apt-get install -y chromium

# Set puppeteer to use system chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# App setup
WORKDIR /app
COPY package.json ./
COPY bun.lockb ./
COPY bun.lock ./
RUN bun install
COPY . .

CMD ["bun", "index.ts"]