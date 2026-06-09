FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist/ ./dist/
COPY src/resources/ ./dist/resources/

CMD ["node", "dist/index.js"]
