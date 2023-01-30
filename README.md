# Retraced Audit Log

<p>
    <a href="https://www.npmjs.com/package/@retracedhq/retraced"><img src="https://img.shields.io/npm/dt/@retracedhq/retraced" alt="npm" ></a>
    <a href="https://hub.docker.com/r/retracedhq/retraced"><img src="https://img.shields.io/docker/pulls/retracedhq/retraced" alt="Docker pulls"></a>
    <a href="https://github.com/retracedhq/retraced/stargazers"><img src="https://img.shields.io/github/stars/retracedhq/retraced" alt="Github stargazers"></a>
    <a href="https://github.com/retracedhq/retraced/issues"><img src="https://img.shields.io/github/issues/retracedhq/retraced" alt="Github issues"></a>
    <a href="https://github.com/retracedhq/retraced/blob/main/LICENSE"><img src="https://img.shields.io/github/license/retracedhq/retraced" alt="license"></a>
    <a href="https://twitter.com/boxyhq"><img src="https://img.shields.io/twitter/follow/boxyhq?style=social" alt="Twitter"></a>
    <a href="https://discord.gg/uyb7pYt4Pa"><img src="https://img.shields.io/discord/877585485235630130" alt="Discord"></a>
</p>

Retraced is the easiest way to integrate a compliant audit log into your application.
It provides a searchable, exportable record of read/write events.
Client libraries are available for [Go](https://github.com/retracedhq/retraced-go) and [Javascript](https://github.com/retracedhq/retraced-js).

## Documentation

Please head to [https://boxyhq.com/docs/retraced/overview](https://boxyhq.com/docs/retraced/overview) for detailed documentation on how to get started with Retraced.

## Usage

### Running with docker-compose

> `docker-compose up -d` or `npm run dev`

**Note:** `ADMIN_ROOT_TOKEN` has been set to `dev` so you can test the setup locally. Please remember to change this (and other relevant sensitive env vars/secrets) in production.

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

> `npm run run:skaffold` or `skaffold run --status-check=false --force=true`

## Swagger Documentation

Swagger spec is generated from source using [TSOA](https://github.com/lukeautry/tsoa)

By default, a swagger spec is built as part of `npm run build`, and is served by express at `/publisher/v1/swagger.json`.

#### Generating a spec

To generate swagger.json from Typescript sources use

```sh
npm run swagger
```

The outputs will be written to build/swagger.json
