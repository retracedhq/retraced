FROM node:7.7.1

EXPOSE 3000

ADD . /src
WORKDIR /src

RUN yarn global add tslint@4.5.1 typescript@2.2.1 node-gyp@3.6.0
