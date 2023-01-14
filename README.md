# Retraced Audit Log

[![CircleCI](https://circleci.com/gh/retracedhq/retraced/tree/main.svg?style=svg)](https://circleci.com/gh/retracedhq/retraced/tree/main)

Retraced is the easiest way to integrate a compliant audit log into your application.
It provides a searchable, exportable record of read/write events.
Client libraries are available for [Go](https://github.com/retracedhq/retraced-go) and [Javascript](https://github.com/retracedhq/retraced-js).

## Usage

### Running with docker-compose

Set `ADMIN_ROOT_TOKEN` environment variable either in `.env` file or in `docker-compose.yaml` file

> `docker-compose up`

### Running with Skaffold

> `make dev` or `skaffold dev --status-check=false --force=true`

## Swagger Documentation

Swagger spec is generated from source using [TSOA](https://github.com/lukeautry/tsoa)

By default, a swagger spec is built as part of `make build`, and is served by express at `/publisher/v1/swagger.json`.

#### Generating a spec

To generate swagger.json from Typescript sources use

```
make swagger
```

The outputs will be written to build/swagger.json
