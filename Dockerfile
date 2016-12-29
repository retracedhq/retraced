FROM node:7.1

EXPOSE 3000

RUN npm install -g yarn

ADD . /src
WORKDIR /src

RUN yarn global add tslint typescript
