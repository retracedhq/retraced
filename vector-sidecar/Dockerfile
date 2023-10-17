FROM timberio/vector:0.X-alpine as builder

FROM node:18.18.0-alpine3.18
COPY --from=builder /usr/local/bin/ /usr/local/bin/
COPY --from=builder /etc/vector/vector.yaml /etc/vector/vector.yaml
COPY --from=builder /var/lib/vector /var/lib/vector
COPY vector.toml /etc/vector/config/vector.toml

WORKDIR /app
COPY package.json package-lock.json ./
RUN yarn
# Copy the Node.js application code
COPY . .
RUN yarn build
ENV PORT 3002
# Expose the port used by the Node.js application
EXPOSE 3002
EXPOSE 8686
CMD vector -w --config-dir /etc/vector/config & node ./dist/index.js
# CMD vector --config /etc/vector/config/*.toml & node index.js