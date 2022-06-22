#!/usr/bin/env bash
#
# script filename
SCRIPT_NAME=$(basename $BASH_SOURCE)
echo ""
echo ""

#
# check that we got two arguments in input
if [ "$#" -ne 0 ] && [ "$#" -ne 1 ]; then
    echo "Usage ${SCRIPT_NAME} (<tag>)"
    echo ""
    echo " prepare a docker image and push it to the github container registry."
    echo " This image is going to be uploaded under the scicatproject repo with name panosc-search-api"
    echo ""
    echo " This script requires the user to be logged in with their own account to github"
    echo " Users can log in by running the following command prior to running this script:"
    echo " > docker login ghcr.io --username <username>"
    echo ""
    echo " arguments:"
    echo " - tag     = git tag or commit we would like to use to create the image"
    echo "             if not specified the tag ysed will be the branch name followed by the latest commit, separted by dash"
    echo "             Example:"
    echo "             - 5d5f42af1ca6816a13b6db60b4778388dc4bf431-develop"
    echo ""
    exit 1
fi

# extract input argument
gitTag=$1

# code repository and branch
# these are not needed anymore as we assume that this script will only be run from within the repo
# after it has been cloned from github.
#
# I leave them here as a reference as they change as of 2021/11/09
# githut repository = https://github.com/panosc-eu/panosc-federated-search-service.git
# available branches
# - master,
# - develop

# local container image
localContainerImage="scicatproject/panosc-search-api:current"
# github container repositories
releaseContainerRepo="ghcr.io/scicatproject/panosc-search-api"

# check if the user provided a tag or not
if [ "-${gitTag}-" == "--" ]; then
    # not git tag from the user
    # define git tag as <branch>-<latest commit>
    gitTag="$(git branch --show-current)-$(git rev-parse HEAD)"
else
    # check out on the specific commit or tag
    git checkout ${gitTag}
fi


# docker image tag
releaseContainerTag="${gitTag}"
releaseContainerImage="${releaseContainerRepo}:${releaseContainerTag}"
stableContainerImage="${releaseContainerRepo}:stable"

#
# gives some feedback to the user
echo "Account                  : ${account}"
echo "Git commit tag           : ${gitTag}"
echo "Local Container image    : ${localContainerImage}"
echo "Release Container tag    : ${releaseContainerTag}"
echo "Release Container image  : ${releaseContainerImage}"
echo "Stable Container image   : ${stableContainerImage}"

#
# create docker image
# if it is already present, remove old image
if [[ "$(docker images -q ${localContainerImage} 2> /dev/null)" != "" ]]; then
    echo "Image already present. Removing it and recreating it"
    docker rmi ${localContainerImage}
    echo ""
fi
echo "Creating image ${localContainerImage}"
docker build -t ${localContainerImage} -f ./Dockerfile .
echo ""

echo "Tagging image for release ${releaseContainerImage}"
docker tag ${localContainerImage} ${releaseContainerImage}

# push image on docker hub repository
echo "Pushing release image"
docker push ${releaseContainerImage}

echo "Tagging image for stable ${stableContainerImage}"
docker tag ${localContainerImage} ${stableContainerImage}

echo "Pushing stable image"
docker push ${stableContainerImage}

echo ""
echo "Done"
echo ""


