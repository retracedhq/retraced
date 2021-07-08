# Retraced Audit Log

[![CircleCI](https://circleci.com/gh/retracedhq/api.svg?style=svg&circle-token=1fd99e91a465e3eda84004605dd836790564e43f)](https://circleci.com/gh/retracedhq/api) [![Code Climate](https://codeclimate.com/repos/58e520bd2a0fec02980000a1/badges/f25b410f9e0a4b58e54b/gpa.svg)](https://codeclimate.com/repos/58e520bd2a0fec02980000a1/feed) [![Coverage Status](https://coveralls.io/repos/github/retracedhq/api/badge.svg?t=smZdfc)](https://coveralls.io/github/retracedhq/api)

Retraced is the easiest way to integrate a compliant audit log into your application.
It provides a searchable, exportable record of read/write events.
Client libraries are available for [Go](https://github.com/retracedhq/retraced-go) and [Javascript](https://github.com/retracedhq/retraced-js).

## Usage

#### Running with Skaffold

> `make dev`

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
