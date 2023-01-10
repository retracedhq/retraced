.PHONY: clean prebuild deps lint swagger routes build cover test build run run-processor run-debug
SKIP :=
REPO := retracedhq/retraced
PATH := $(shell pwd):${PATH}
SHELL := /bin/bash -lo pipefail

clean:
	rm *.snyk-patch

prebuild:
	rm -rf build
	mkdir -p build

deps:
	npm install

lint:
	`npm bin`/tslint --project ./tsconfig.json --fix


swagger:
	`npm bin`/tsoa swagger

routes:
	`npm bin`/tsoa routes

build: swagger routes
	`npm bin`/tsc
	cp build/src/retracedctl.js build/src/retracedctl && chmod +x build/src/retracedctl

cover:
	npm run cover
test:
	npm test

run:
	node --no-deprecation ./build/index.js

run-processor:
	node --no-deprecation ./build/_processor/index.js

run-debug:
	node --no-deprecation ./build/index.js
# `npm bin`/ts-node --inspect=0.0.0.0 --no-deprecation ./src/index.ts

k8s-pre:
	rm -rf build/k8s
	mkdir -p build/k8s

k8s-deployment:
	`npm bin`/handlebars --tag '"$(tag)"'       < deploy/k8s/api-deployment.yml.hbs > build/k8s/api-deployment.yml
	`npm bin`/handlebars --tag '"$(tag)"'       < deploy/k8s/processor-deployment.yml.hbs > build/k8s/processor-deployment.yml
	`npm bin`/handlebars --tag '"$(tag)"'       < deploy/k8s/cron-deployment.yml.hbs > build/k8s/cron-deployment.yml
	`npm bin`/handlebars --tag '"$(tag)"'       < deploy/k8s/nsqd-deployment.yml.hbs > build/k8s/nsqd-deployment.yml

k8s-service:
	`npm bin`/handlebars                          < deploy/k8s/api-service.yml.hbs    > build/k8s/api-service.yml
	`npm bin`/handlebars                          < deploy/k8s/nsqd-service.yml.hbs    > build/k8s/nsqd-service.yml

k8s-ingress:
	`npm bin`/handlebars                          < deploy/k8s/api-ingress.yml.hbs    > build/k8s/api-ingress.yml

k8s-migrate:
	`npm bin`/handlebars --tag '"$(tag)"' < ./deploy/k8s/migratepg-job.yml.hbs > ./build/k8s/migratepg-job.yml
	`npm bin`/handlebars --tag '"$(tag)"' < ./deploy/k8s/migratees-job.yml.hbs > ./build/k8s/migratees-job.yml

k8s: k8s-pre k8s-deployment k8s-service k8s-ingress k8s-migrate
	: "Templated k8s yamls"

dev:
	skaffold dev --status-check=false --force=true
