FROM node:8.7

EXPOSE 3000

ADD . /src
WORKDIR /src

RUN make deps
RUN npm run snyk-protect
RUN make build

RUN cp ./bin/retracedctl /usr/local/bin/retracedctl

CMD ["node", "--no-deprecation", "./build/index.js"]
