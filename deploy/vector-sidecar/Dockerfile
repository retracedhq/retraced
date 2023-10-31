FROM timberio/vector:0.X-alpine as builder

FROM node:18.18.0-alpine3.18
COPY --from=builder /usr/local/bin/ /usr/local/bin/
COPY --from=builder /etc/vector/vector.yaml /etc/vector/vector.yaml
COPY --from=builder /var/lib/vector /var/lib/vector
COPY vector.json /etc/vector/config/vector.json

WORKDIR /src
COPY pm2.config.js /src/pm2.config.js
ADD package.json /src
ADD package-lock.json /src
RUN npm install
# Copy the Node.js application code
ADD . /src
RUN npm run build
RUN npm i -g pm2
ENV PORT 3002
# Expose the port used by the Node.js application
EXPOSE 3002
EXPOSE 8686
# CMD vector -w --config-dir /etc/vector/config & node /src/build/src/ee/_vector-sidecar/index.js
CMD ["pm2-runtime", "start", "/src/pm2.config.js"]