FROM node:7.1

EXPOSE 3000

RUN npm install -g yarn

ADD . /src
WORKDIR /src

RUN yarn global add tslint@4.0.2 typescript@2.1.1
RUN yarn
RUN make build

CMD ["node", "--no-deprecation", "./build/index.js"]