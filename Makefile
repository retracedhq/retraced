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
