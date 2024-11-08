FROM ghcr.io/puppeteer/puppeteer:19.7.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

# Crear un directorio para los archivos de salida y establecer permisos
RUN mkdir -p /usr/src/app/output && chown -R node:node /usr/src/app/output

COPY package*.json ./
RUN npm ci
COPY . .

# Cambiar al usuario node que tiene permisos adecuados
USER node

CMD [ "node", "index.js" ]
