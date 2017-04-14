# Retraced API

[![CircleCI](https://circleci.com/gh/retracedhq/api.svg?style=svg&circle-token=1fd99e91a465e3eda84004605dd836790564e43f)](https://circleci.com/gh/retracedhq/api) [![Code Climate](https://codeclimate.com/repos/58e520bd2a0fec02980000a1/badges/f25b410f9e0a4b58e54b/gpa.svg)](https://codeclimate.com/repos/58e520bd2a0fec02980000a1/feed) [![Coverage Status](https://coveralls.io/repos/github/retracedhq/api/badge.svg?t=smZdfc)](https://coveralls.io/github/retracedhq/api)

Key responsibilities of the retraced API include:

- Receiving and storing CreateEvent requests
- Creating ViewerTokens to power the embeded `logs` viewer
- Responding to queiries from embedded `logs` with results from Elasticsearch
- Probably some EITAPI stuff
- Handle Auth0 login callback
- Tokens, stats, etc.

## Usage
#### Install deps
> `yarn`

#### Run server
> `make build run`

#### Run tests
> `yarn test`

#### Running with [Composer](https://github.com/retracedhq/composer)

> `docker-compose -f ../composer/docker-compose.yml up api`


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

