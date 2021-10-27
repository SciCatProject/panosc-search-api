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
   export BASE_URL=<CATAMEL_API_BASE_URL> # e.g. https://scicat.ess.eu/api/v3
   export FACILITY=<YOUR_FACILITY> # e.g. ESS
   ```
5. `npm start`

## Tests

If PSS is enabled, the following parameters should provide a good enough testing:

- filter={"limit":10}
- query="temperatura kafka"
