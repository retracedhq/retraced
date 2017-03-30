FROM node:7.7.1

EXPOSE 3000

ADD . /src
WORKDIR /src

RUN yarn global add tslint@4.3.1 typescript@2.1.5 node-gyp
RUN yarn
RUN make build

CMD ["node", "--no-deprecation", "./build/index.js"]
