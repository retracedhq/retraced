# Retraced Audit Log

[![CircleCI](https://circleci.com/gh/retracedhq/retraced/tree/main.svg?style=svg)](https://circleci.com/gh/retracedhq/retraced/tree/main)

Retraced is the easiest way to integrate a compliant audit log into your application.
It provides a searchable, exportable record of read/write events.
Client libraries are available for [Go](https://github.com/retracedhq/retraced-go) and [Javascript](https://github.com/retracedhq/retraced-js).

## Usage

### Running with docker-compose

Set `ADMIN_ROOT_TOKEN` environment variable either in `.env` file or in `docker-compose.yaml` file

> `docker-compose up`

### Run an example to see how Retraced works

Git checkout the Logs Viewer [repo](https://github.com/retracedhq/logs-viewer) and run `npm i` followed by `npm run dev` to start an example which uses Retraced to show you some auto generated events. Refresh the UI a few times for the auto-generated audit logs to kick in. You can also ingest a few custom logs using the following curl command:-

```sh
curl -X POST -H "Content-Type: application/json" -H "Authorization: token=dev" -d '{
  "action": "some.record.created",
  "teamId": "boxyhq",
  "group": {
    "id": "dev",
    "name": "dev"
  },
  "crud": "c",
  "created": "2023-01-16T15:48:44.573Z",
  "source_ip": "127.0.0.1",
  "actor": {
    "id": "jackson@boxyhq.com",
    "name": "Jackson"
  },
  "target": {
    "id": "100",
    "name": "tasks",
    "type": "Tasks"
  }
}' http://localhost:3000/auditlog/publisher/v1/project/dev/event
```

You can also use the [Admin Portal](http://localhost:5225) but will need to setup the SMTP env vars so that you can use the magic link to log into the Portal, we are working to support other forms of authentication and would love to hear which provider you'd like supported next.

### Running with Skaffold

You could alternatively use Skaffold instead of docker-compose to run Retraced locally.

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
