FROM node:7.8

EXPOSE 3000

ADD . /src
WORKDIR /src

RUN make deps build

CMD ["node", "--no-deprecation", "./build/index.js"]
