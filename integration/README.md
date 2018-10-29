qa-integation-rtrcd
==========

QA Integration Retraced is a test suite for Retraced that runs within a Docker container.

## Dependencies

Tests will look for these environment variables or will default to the QA environment on GCE:

* PUBLISHER_API_ENDPOINT

* PROJECT_ID

* ENVIRONMENT_ID

* PUBLISHER_API_KEY

## Setup

### Build the selenium container (Selenium not yet implemented)
```shell
sudo make selenium
```

### Build the development container
```shell
sudo make docker
```

Which builds and tags the container as `qa-integration-rtrcd:latest`.

### Startup the runtime environment
```shell
sudo -E make shell
```

### Run tests
```shell
make test
```
