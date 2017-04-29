#!/bin/bash

set -e
set -o nounset
set -o pipefail


# try several times with increasing sleep time between
# POST'ing event and  
for time in 3000 6000 10000 20000; do

    echo Running Integration Tests:
    echo PUBLISHER_API_ENDPOINT=$PUBLISHER_API_ENDPOINT
    echo PROJECT_ID=$PROJECT_ID
    echo ENVIRONMENT_ID=$ENVIRONMENT_ID
    echo PUBLISHER_API_KEY=$PUBLISHER_API_KEY
    echo QA_INTEGRATION_VERSION=$QA_INTEGRATION_VERSION
    echo ES_INDEX_WAIT_MS=$time

    docker run -it --rm \
        -e PUBLISHER_API_ENDPOINT=$PUBLISHER_API_ENDPOINT \
        -e PROJECT_ID=$PROJECT_ID \
        -e ENVIRONMENT_ID=$ENVIRONMENT_ID \
        -e PUBLISHER_API_KEY=$PUBLISHER_API_KEY \
        -e ES_INDEX_WAIT_MS=$time \
        quay.io/retracedhq/qa-integration:$QA_INTEGRATION_VERSION \
        npm test \
        && echo "COMPLETED USING SLEEP OF ${time}ms" \
        && exit 0
done

exit 1



