FROM node:7.1

EXPOSE 3000

# This works around a problem with yarn & CircleCI
# It'll be fixed in an upcoming version of yarn 
RUN adduser retraced
RUN chown -R retraced /home/retraced
RUN chown -R retraced /usr/local

USER retraced
ADD . /home/retraced/retraced-api

WORKDIR /home/retraced/retraced-api
RUN npm i -g yarn
RUN yarn
RUN make build

CMD ["node", "--no-deprecation" "./build/index.js"]