FROM --platform=linux/amd64 node:18.11.0 as node

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl


ENV SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.1.12/supercronic-linux-amd64
ENV SUPERCRONIC=supercronic-linux-amd64
ENV SUPERCRONIC_SHA1SUM=048b95b48b708983effb2e5c935a1ef8483d9e3e
RUN curl -fsSLO "$SUPERCRONIC_URL" \
    && echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c - \
    && chmod +x "$SUPERCRONIC" \
    && mv "$SUPERCRONIC" "/usr/local/bin/${SUPERCRONIC}" \
    && ln -s "/usr/local/bin/${SUPERCRONIC}" /usr/local/bin/replicated-auditlog-cron

COPY deploy/crontab /crontab

EXPOSE 3000 9229
ADD ./package.json /src/package.json
ADD ./yarn.lock /src/yarn.lock
WORKDIR /src
RUN yarn install

ADD . /src
ADD migrations/pg /src/migrations/pg
RUN make routes
RUN make swagger

# RUN sed -i.bak 's/lazyLoad(.\(.\+\).\, opts)/require(".\/api\/\1.js")/g' node_modules/@elastic/elasticsearch/api/index.js

RUN chmod a+rwx /src
