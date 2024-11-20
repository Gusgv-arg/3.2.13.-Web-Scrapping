FROM ghcr.io/puppeteer/puppeteer:19.7.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    SCRAPER_API_KEY=41ea7d69a10d85a55eef273f9487c13b \
    APIFY_TOKEN=apify_api_dlX9xHKkHFTQwc4Zy5obbKHdeAo88P2PHgsS

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

CMD [ "node", "index.js" ]
