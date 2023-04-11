FROM node:16-bullseye-slim

RUN apt-get update \
  && apt-get install -y ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /src

ADD package.json /src
ADD package-lock.json /src

RUN npm install

ADD . /src

RUN npm run build

# CMD ["node", "build/src/_processor/temporal/workers/index.js"]
