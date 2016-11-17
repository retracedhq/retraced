FROM node:7.1-alpine

EXPOSE 3000

ADD . /retraced-api

WORKDIR /retraced-api
RUN npm i -g yarn
RUN yarn
RUN make build

CMD ["node", "--no-deprecation" "./build/index.js"]