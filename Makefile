# Expected env:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# RETRACED_ENV (e.g. "staging" or "joe")
# RETRACED_PREFIX (e.g. "retraced")
# RETRACED_SUFFIX (e.g. "joe")

deploy:
	cp config/${RETRACED_ENV}.json ./config.json
	echo "running 'serverless deploy -s ${RETRACED_ENV}'"
	serverless deploy -s ${RETRACED_ENV}

run:
	cp config/dev.json ./config.json
	serverless offline --corsAllowHeaders='accept,content-type,authorization' --host=0.0.0.0
