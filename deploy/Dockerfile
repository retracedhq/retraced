FROM node:7.1

EXPOSE 3000

ADD . /retraced-api

WORKDIR /retraced-api
RUN npm i -g yarn
RUN yarn
RUN make build

CMD ["node", "--no-deprecation" "/retraced-api/lib/index.js"]