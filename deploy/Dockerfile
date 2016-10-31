FROM node:4.6.1

EXPOSE 3000

ADD . /retraced-api

WORKDIR /retraced-api
RUN npm i

CMD ["node", "/retraced-api/lib/index.js"]