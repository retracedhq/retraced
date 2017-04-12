prebuild:
	rm -rf build

deps:
	# https://github.com/yarnpkg/yarn/issues/2266
	yarn global add node-gyp
	yarn install --force

build: prebuild
	mkdir -p build
	`yarn bin`/tslint --project ./tsconfig.json --fix
	`yarn bin`/tsc

run:
	node --no-deprecation ./build/index.js

test: build
	yarn test

k8s-pre:
	rm -rf build/k8s
	mkdir -p build/k8s

k8s-deployment:
	`yarn bin`/handlebars --tag $(tag)       < deploy/k8s/api-deployment.yml.hbs > build/k8s/api-deployment.yml

k8s-service:
	`yarn bin`/handlebars                          < deploy/k8s/api-service.yml.hbs    > build/k8s/api-service.yml

k8s-ingress:
	`yarn bin`/handlebars                          < deploy/k8s/api-ingress.yml.hbs    > build/k8s/api-ingress.yml

k8s: k8s-pre k8s-deployment k8s-service k8s-ingress
	: "Templated k8s yamls"
