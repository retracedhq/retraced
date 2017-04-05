#!/bin/bash
# CircleCI kubernetes deploy script

set -o errexit
set -o nounset
set -o pipefail

echo Deploying to GKE:
echo PROJECT_NAME=$PROJECT_NAME
echo CLUSTER_NAME=$CLUSTER_NAME
echo CLOUDSDK_COMPUTE_ZONE=$CLOUDSDK_COMPUTE_ZONE
echo CIRCLE_SHA1=$CIRCLE_SHA1
echo IMAGE_TAG=${CIRCLE_SHA1:0:7}

function gcloud_cli() {
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet components update --version 120.0.0
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet components update --version 120.0.0 kubectl

    echo $GCLOUD_ACCOUNT_JSON | base64 --decode -i > ${HOME}/account.json
    sudo /opt/google-cloud-sdk/bin/gcloud auth activate-service-account --key-file ${HOME}/account.json

    sudo /opt/google-cloud-sdk/bin/gcloud config set project $PROJECT_NAME
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set container/cluster $CLUSTER_NAME
    sudo /opt/google-cloud-sdk/bin/gcloud config set compute/zone ${CLOUDSDK_COMPUTE_ZONE}
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet container clusters get-credentials $CLUSTER_NAME
}


function template_yamls() {
    rm -rf build/k8s
    mkdir -p build/k8s
    yarn global add handlebars-cmd
    set -v
    handlebars --tag ${CIRCLE_SHA1:0:7} < deploy/k8s/api-deployment.yml.hbs > build/k8s/api-deployment.yml
    handlebars                          < deploy/k8s/api-service.yml.hbs    > build/k8s/api-service.yml
    handlebars                          < deploy/k8s/api-ingress.yml.hbs    > build/k8s/api-ingress.yml
    set +v
}

function chown_home() {
    sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube
}

function ship_it() {
    kubectl apply -f build/k8s/
}

gcloud_cli
template_yamls
chown_home
ship_it 

