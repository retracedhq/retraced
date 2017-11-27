clean:
	rm *.snyk-patch

prebuild:
	rm -rf build
	mkdir -p build

deps:
	# https://github.com/yarnpkg/yarn/issues/2266
	yarn global add node-gyp
	yarn install --force

lint:
	`yarn bin`/tslint --project ./tsconfig.json --fix

swagger:
	`yarn bin`/tsoa swagger

routes:
	`yarn bin`/tsoa routes

build: prebuild lint swagger routes
	`yarn bin`/tsc

# Bundle into two standalone binaries so we can obfuscate the source code
#
# the sed command is because pg-format uses a bizarre import that does `require(__dirname + '/some-module')`
# and we need to change it to `require('./some-module')` to make `pkg` work, because pkg can't currently
# handle imports that are not string literals.
pkg:
	sed -i.bak "s/__dirname + '/'.\//g" node_modules/pg-format/lib/index.js
	 `yarn bin`/pkg -t node8-linux --options no-deprecation --output api ./build/index.js
	 `yarn bin`/pkg -t node8-linux --options no-deprecation --output retracedctl ./build/retracedctl.js

run:
	node --no-deprecation ./build/index.js

test: build
	yarn test

k8s-pre:
	rm -rf build/k8s
	mkdir -p build/k8s

k8s-deployment:
	`yarn bin`/handlebars --tag '"$(tag)"'       < deploy/k8s/api-deployment.yml.hbs > build/k8s/api-deployment.yml

k8s-service:
	`yarn bin`/handlebars                          < deploy/k8s/api-service.yml.hbs    > build/k8s/api-service.yml

k8s-ingress:
	`yarn bin`/handlebars                          < deploy/k8s/api-ingress.yml.hbs    > build/k8s/api-ingress.yml

k8s: k8s-pre k8s-deployment k8s-service k8s-ingress
	: "Templated k8s yamls"

