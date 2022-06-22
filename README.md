# Photon and Neutron Search Api

[![Build Status](https://github.com/SciCatProject/panosc-search-api/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/SciCatProject/panosc-search-api/actions)
[![DeepScan grade](https://deepscan.io/api/teams/8394/projects/16919/branches/371292/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=8394&pid=16919&bid=371292)
[![Known Vulnerabilities](https://snyk.io/test/github/SciCatProject/panosc-search-api/master/badge.svg?targetFile=package.json)](https://snyk.io/test/github/SciCatProject/panosc-search-api/master?targetFile=package.json)

## Prerequisites

- npm >= 6
- node >= 10

## Steps

1. `git clone https://github.com/SciCatProject/panosc-search-api.git`

2. `cd panosc-search-api`

3. `npm install`

4. Set the ENV variables
   ```bash
   export BASE_URL=<CATAMEL_API_BASE_URL>               # e.g. https://scicat.ess.eu/api/v3
   export FACILITY=<YOUR_FACILITY>                      # e.g. ESS
   export PSS_BASE_URL=<PANOSC_SEARCH_SCORING_API_URL>  # e.g. http://scicat08.esss.lu.se:32222
   export PSS_ENABLE=<1 or 0>                           # e.g. 1 if you have a PSS running in your facility or 0 if you do not
   export RETURN_ZERO_CODE=<1 or 0>                     # e.g. 1 if you would like to retrieve items that have a score of zero when scoring is enabled
   ```

5. `npm start`

## Official documentation

Please refer to the reference implementation of the PaNOSC Search API for all the official documentation.
It can be found [here](https://github.com/panosc-eu/search-api#readme)

Additional information regarding queries, can be found in the documentation of the PaNOSC Federated Search.
IT can be found [here](https://github.com/panosc-eu/panosc-federated-search-service#readme)


## Tests

If you are interested in testing the scoring capabilities and document relevancy, here is a quick how-to

1. make sure that the PSS scoring is enabled.
   At ESS, the relevant environmental variables are set as following:
   ```bash
   export PSS_BASE_URL="http://scicat08.esss.lu.se:32222"
   export PSS_ENABLE=1
   ```
   Make sure to point to your own PaNOSC Scoring Service instance. The ESS one is not publicly accessible

2. access the explorer interface at http://localhost:3000/explorer

3. search for 10 top most relevant datasets/documents that are relevant to the key words *temperature* and *kafka*. Copy and paste the following filter and query in the matching fields of the enpoints *Datasets* or *Documents*:
   - filter = {"limit":10}
   - query  = "temperature kafka"

   or you can combine them in just the following filter expression:
   - filter - {"limit:10,"query":"temperature kafka"}

   They are equivalent.

## Generate a new release

In order to generate a new release, please follow the new few steps
1. Make sure that the code is properly tagged with the correct version
2. Make sure that your account on GitHub has upload permissions for packages
3. Login on GitHub container registry:
   ```bash
   docker login ghcr.io --username <your-github--username>
   ```
4. Run the release script:
   ```bash
   docker-image-release.sh <release-tag>
   ```

## Deploy docker image

If you would like to deploy the docker image containing the PaNOSC Search API SciCat implementation,
please refer to the related container repository accessible on github at the following URL:

  - https://github.com/SciCatProject/panosc-search-api/pkgs/container/panosc-search-api

To install the latest stable releas of the PaNOSC Search API (SciCat implementation), 
you may run the following command in a terminal:
```bash
   docker pull ghcr.io/scicatproject/panosc-search-api:stable
```

If you want to deploy a specific version, replace _stable_ with the version tag. 
If you weant to install verion 1.1.2, the command should be:
```bash
   docker pull ghcr.io/scicatproject/panosc-search-api:v1.1.2
```

You can also use the full image name in a docker compose file.

