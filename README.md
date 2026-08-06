# Retraced API

[![CircleCI](https://circleci.com/gh/retracedhq/api.svg?style=svg&circle-token=1fd99e91a465e3eda84004605dd836790564e43f)](https://circleci.com/gh/retracedhq/api) [![Code Climate](https://codeclimate.com/repos/58e520bd2a0fec02980000a1/badges/f25b410f9e0a4b58e54b/gpa.svg)](https://codeclimate.com/repos/58e520bd2a0fec02980000a1/feed) [![Coverage Status](https://coveralls.io/repos/github/retracedhq/api/badge.svg?t=smZdfc)](https://coveralls.io/github/retracedhq/api)

Key responsibilities of the retraced API include:

- Receiving and storing CreateEvent requests
- Creating ViewerTokens to power the embeded `logs` viewer
- Responding to queiries from embedded `logs` with results from Elasticsearch
- Probably some EITAPI stuff
- Handle Auth0 login callback
- Tokens, stats, etc.

## Contributing

If there's a relevant clubhouse story, include `chXXX` with the story ID
in your pull request.

## Prerequisites

- Docker with Compose v2
- `curl` and `jq`, for the smoke-test commands below

## Usage
#### Install deps
> `yarn`

#### Run server
> `make build run`

#### Run tests
> `yarn test`

#### Running with Docker Compose

Builds retraced from source and runs the full stack (postgres, elasticsearch,
nsqd, api, processor, cron), pre-seeded with a bootstrapped project/environment/API
key. See `docker-compose.yml`'s header comment for connection details.

> `make compose-up-build`

Other targets: `compose-up` (start without rebuilding), `compose-down`,
`compose-reset` (also drops volumes, for a clean db/search index), `compose-ps`
(check container status).

#### Smoke-testing the dev env

Once `compose-up-build` is healthy, send an event and read it back:

```sh
curl -s -X POST http://localhost:3000/publisher/v1/project/local-dev-project-id/event \
  -H "Authorization: token=local-dev-api-token" \
  -H "Content-Type: application/json" \
  -d '{"action":"test.event","crud":"c","is_anonymous":true}'
```

Wait a couple seconds for the processor to normalize/index it, then:

```sh
curl -s -X POST http://localhost:3000/publisher/v1/project/local-dev-project-id/graphql \
  -H "Authorization: token=local-dev-api-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { search(last: 5) { totalCount edges { node { id action crud received canonical_time } } } }"}' | jq .
```

A successful create returns `{"id": ..., "hash": ...}`, and the event should show up in the search results.

## Swagger Documentation

Swagger spec is generated from source using [TSOA](https://github.com/lukeautry/tsoa)

By default, a swagger spec is built as part of `make build`, and is served by express at `/publisher/v1/swagger.json`.

In staging/production, these specs are fed to [readme.io](https://readme.io), but it is possible to generate/preview them locally.


#### Generating a spec

To generate swagger.json from Typescript sources use

```
make swagger
```

The outputs will be written to build/swagger.json

#### Previewing a spec

The first time you generate markup, you will need to `make markup-deps` to install tooling.

Then you can

```
make markup-docs
```

which will build `build/swagger.adoc`, convert to `build/swagger.html`, and open using `google-chrome`


## Building library images for on-prem

```sh
docker build --pull -t registry.replicated.com/library/retraced:${SEMVER} -f deploy/Dockerfile-slim .
docker push registry.replicated.com/library/retraced:${SEMVER}
```
