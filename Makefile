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


# mostly stolen from replicatedcom/vendor-api and replicatedhq/docs
# thanks martin!
markup-deps:
	mkdir -p java/
	curl -o java/swagger2markup-cli-1.0.0.jar http://central.maven.org/maven2/io/github/swagger2markup/swagger2markup-cli/1.0.0/swagger2markup-cli-1.0.0.jar
	curl -o java/swagger2markup-1.0.0.jar http://central.maven.org/maven2/io/github/swagger2markup/swagger2markup/1.0.0/swagger2markup-1.0.0.jar
	sudo gem install asciidoctor

markup-docs: swagger
	java -cp java/swagger2markup-1.0.0.jar -jar java/swagger2markup-cli-1.0.0.jar convert -i build/swagger.json -f build/swagger
	asciidoctor build/swagger.adoc
	echo docs available at file://${PWD}/build/swagger.html


