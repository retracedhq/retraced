prebuild:
	rm -rf build

build: prebuild
	mkdir -p build
	./node_modules/.bin/tsc

run: build
	cp config/${RETRACED_ENV}.json config/config.json	
	node --no-deprecation ./build/index.js
