SHELL := /bin/bash
COMPOSER_TEST_HOST ?= localhost
.PHONY: test

docker:
	docker build -t qa-integration-rtrcd .

shell:
	docker run --rm -it -P --name qa-integration-rtrcd \
		-e PUBLISHER_API_ENDPOINT=$(PUBLISHER_API_ENDPOINT) \
		-e PROJECT_ID=$(PROJECT_ID) \
		-e ENVIRONMENT_ID=$(ENVIRONMENT_ID) \
		-e PUBLISHER_API_KEY=$(PUBLISHER_API_KEY) \
		-v ${PWD}:/test \
		qa-integration-rtrcd

test:
	yarn test

selenium:
	docker run -d --name selenium \
		-p 4444:4444 \
		-p 5900:5900 \
		selenium/standalone-chrome-debug:3.0.1-dysprosium
lint:
	`yarn bin`/tslint --project ./tsconfig.json --fix

# uses `localhost` as default, so run this from the host, or set COMPOSER_TEST_HOST
test-composer:
	PUBLISHER_API_ENDPOINT=http://$(COMPOSER_TEST_HOST):3000 ENVIRONMENT_ID=composer PROJECT_ID=composer PUBLISHER_API_KEY=composer npm test
