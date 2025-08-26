FROM node:18

# Install chromium
RUN apt-get update && apt-get install -y chromium

# Set puppeteer to use system chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# App setup
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]