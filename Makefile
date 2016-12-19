prebuild:
	rm -rf build

build: prebuild
	mkdir -p build
	./node_modules/.bin/tslint --project ./tsconfig.json
	./node_modules/.bin/tsc

run:
	node --no-deprecation ./build/index.js
