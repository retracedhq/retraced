FROM timberio/vector:0.X-alpine as builder

FROM node:18.18.0-alpine3.18
COPY --from=builder /usr/local/bin/ /usr/local/bin/
COPY --from=builder /etc/vector/vector.yaml /etc/vector/vector.yaml
COPY --from=builder /var/lib/vector /var/lib/vector
COPY vector.json /etc/vector/config/vector.json

WORKDIR /src
ADD package.json /src
ADD package-lock.json /src
RUN npm install
# Copy the Node.js application code
ADD . /src
RUN npm run build
ENV PORT 3002
# Expose the port used by the Node.js application
EXPOSE 3002
EXPOSE 8686
CMD vector -w --config-dir /etc/vector/config & node /src/build/src/ee/_vector-sidecar/index.js
# CMD vector --config /etc/vector/config/*.toml & node index.js