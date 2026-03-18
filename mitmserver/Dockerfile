FROM node:18-alpine

WORKDIR /app

COPY mitmserver/package*.json ./

RUN npm ci

COPY mitmserver/server.js ./

EXPOSE 8080 8081

CMD ["npm", "start"]
