prebuild:
	rm -rf build

deps:
	yarn

build: prebuild
	mkdir -p build
	`yarn bin`/tslint --project ./tsconfig.json
	`yarn bin`/tsc

run:
	node --no-deprecation ./build/index.js

test: build
	yarn test