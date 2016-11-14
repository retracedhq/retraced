build:
	mkdir -p lib
	./node_modules/.bin/tsc

run: build
	cp config/${RETRACED_ENV}.json config/config.json	
	node --no-deprecation lib/index.js
