FROM ghcr.io/puppeteer/puppeteer:19.7.2

# Copiar el archivo .env al contenedor
COPY .env ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    SCRAPER_API_KEY=${SCRAPER_API_KEY} \
    APIFY_TOKEN=${APIFY_TOKEN} 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

CMD [ "node", "index.js" ]
