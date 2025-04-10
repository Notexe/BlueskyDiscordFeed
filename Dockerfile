FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

VOLUME /config

ENV NODE_ENV=production

CMD ["npm", "start"]