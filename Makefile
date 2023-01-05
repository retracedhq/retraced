.PHONY: clean prebuild deps lint swagger routes build cover test report-coverage pkg build run run-processor run-debug
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
	mkdir -p bin && cp build/src/retracedctl.js bin/retracedctl && chmod +x bin/retracedctl

cover:
	npm run cover
test:
	npm test

report-coverage:
	npm run report-coverage

# Bundle into four standalone binaries so we can obfuscate the source code
#
# the sed command is because ug-format uses a bizarre import that does `require(__dirname + '/some-module')`
# and we need to change it to `require('./some-module')` to make `pkg` work, because pkg can't currently
# handle imports that are not string literals.
# sed -i.bak 's/lazyLoad(.\(.\+\).\, opts)/require(".\/api\/\1.js")/g' node_modules/@elastic/elasticsearch/api/index.js &&
# 	sed -i.bak 's/function ESAPI/const path = require("path");\nfunction ESAPI/g' node_modules/@elastic/elasticsearch/api/index.js && cat node_modules/@elastic/elasticsearch/api/index.js && 
pkg:
	if [ -n "$(SKIP)" ]; then exit 0; else \
	sed -i.bak "s/__dirname + '/'.\//g" node_modules/pg-format/lib/index.js && \
	sed -i.bak 's/lazyLoad(.\(.\+\).\, opts)/require(".\/api\/\1.js")(opts)/g' node_modules/@elastic/elasticsearch/api/index.js && \
	 `npm bin`/pkg -t node16-linux --options no-deprecation --output api ./build/src/index.js && \
	 `npm bin`/pkg -t node16-linux --options no-deprecation --output retracedctl ./build/src/retracedctl.js && \
	 `npm bin`/pkg -t node16-linux --options no-deprecation --output processor ./build/src/_processor/index.js && \
	 `npm bin`/pkg -t node16-linux --options no-deprecation --output retraceddb ./build/src/_db/runner-lite.js && \
	 `npm bin`/pkg -t node16-linux --options "max_old_space_size=4096,no-deprecation" --output retraceddb4G ./build/src/_db/runner-lite.js && \
	 `npm bin`/pkg -t node16-linux --options "max_old_space_size=8192,no-deprecation" --output retraceddb8G ./build/src/_db/runner-lite.js  &&  \
	 `npm bin`/pkg -t node16-linux --options "max_old_space_size=16384,no-deprecation" --output retraceddb16G ./build/src/_db/runner-lite.js; \
	 fi

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
