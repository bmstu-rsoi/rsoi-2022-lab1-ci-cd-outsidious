FROM node:14-alpine3.12

COPY src/ /app/
WORKDIR /app

RUN npm install

CMD [ "node", "./app/main.js"]