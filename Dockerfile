# syntax=docker/dockerfile:1

FROM node:14.18.1-alpine
ENV NODE_ENV=debug

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

CMD [ "node", "-r", "ts-node/register", "--no-warnings", "./src/bot.ts" ]
