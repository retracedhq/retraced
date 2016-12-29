prebuild:
	rm -rf build

deps:
	yarn

build: prebuild
	mkdir -p build
	tslint --project ./tsconfig.json
	tsc

run:
	node --no-deprecation ./build/index.js

test: build
	yarn test