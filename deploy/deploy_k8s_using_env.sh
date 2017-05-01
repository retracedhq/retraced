#!/bin/bash
# CircleCI kubernetes deploy script

set -o errexit
set -o nounset
set -o pipefail

IMAGE_TAG=${CIRCLE_SHA1:0:7}

echo Deploying to GKE:
echo PROJECT_NAME=$PROJECT_NAME
echo CLUSTER_NAME=$CLUSTER_NAME
echo CLOUDSDK_COMPUTE_ZONE=$CLOUDSDK_COMPUTE_ZONE
echo CIRCLE_SHA1=$CIRCLE_SHA1
echo IMAGE_TAG=${IMAGE_TAG}

function gcloud_cli() {
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet components update --version 153.0.0
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet components update --version 153.0.0 kubectl

    echo $GCLOUD_ACCOUNT_JSON | base64 --decode -i > ${HOME}/account.json
    sudo /opt/google-cloud-sdk/bin/gcloud auth activate-service-account --key-file ${HOME}/account.json

    sudo /opt/google-cloud-sdk/bin/gcloud config set project $PROJECT_NAME
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set container/cluster $CLUSTER_NAME
    sudo /opt/google-cloud-sdk/bin/gcloud config set compute/zone ${CLOUDSDK_COMPUTE_ZONE}
    sudo /opt/google-cloud-sdk/bin/gcloud --quiet container clusters get-credentials $CLUSTER_NAME
}


function template_yamls() {
    make k8s tag=${IMAGE_TAG}
}

function chown_home() {
    sudo chown -R $USER /home/ubuntu/.config
}

function ship_it() {
    echo "Applying yamls to $CLUSTER_NAME"
    cat build/k8s/*
    kubectl apply -f build/k8s/
}

gcloud_cli
template_yamls
chown_home
ship_it 

