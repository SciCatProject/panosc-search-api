#!/bin/bash
#
# run panosc search api locally on the machine that is run
# it uses official scicat and PSS

export PSS_BASE_URL="http://scicat08.esss.lu.se:32222"
export PSS_ENABLE=1
export BASE_URL="https://scicat.ess.eu/api/v3"
export FACILITY="ESS"

npm start
