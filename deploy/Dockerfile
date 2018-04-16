FROM node:8.7

EXPOSE 3000

ADD . /src
WORKDIR /src

RUN npm run snyk-protect
RUN make deps build
RUN cp ./bin/retracedctl /usr/local/bin/retracedctl

CMD ["node", "--no-deprecation", "./build/index.js"]
