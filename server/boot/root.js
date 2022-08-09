// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

"use strict";

const utils = require("../../common/utils");
const PSSService = require("../../common/pss-service");
const pssScoreService = new PSSService.Score();

module.exports = function(server) {
  // Install a `/` route that returns server status
  const router = server.loopback.Router();
  //router.get("/", server.loopback.status());

  router.get("/", async (req, res) => {

    const apiVersion = process.env.API_VERSION || "unknown";
    const dockerImageVersion = process.env.DOCKER_IMAGE_VERSION || "unknown";
    const facility = process.env.FACILITY || "unknown";
    const environment = process.env.NODE_ENV || "unknown";
    const scicatURL = process.env.BASE_URL || "unknown";
    const techniquesURL = process.env.PANET_BASE_URL || "unknown";
    const scoringURL = process.env.PSS_BASE_URL || "unknown";
    const scoringEnabled = utils.getBoolEnvVar("PSS_ENABLE",false);
    const returnZeroScore = utils.getBoolEnvVar("RETURN_ZERO_SCORE",false);
    const passDocumentsToScoring = utils.getBoolEnvVar("PASS_DOCUMENTS_TO_SCORING",false);

    let scoringResponse = {};
    let scoringStatus = 0;
    if (scoringEnabled) {
      scoringResponse = await pssScoreService.status();
      scoringStatus = scoringResponse.status;
    }

    function format(inputSeconds) {
      function pad(s) {
        return (s < 10 ? "0" : "") + s;
      }
      var hours = Math.floor(inputSeconds / (60 * 60));
      var minutes = Math.floor(inputSeconds % (60 * 60) / 60);
      var seconds = Math.floor(inputSeconds % 60);

      return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
    }

    const uptime = process.uptime();

    const responseString = {
      "uptime_seconds": uptime,
      "uptime": format(uptime),
      "api_version": apiVersion,
      "docker_image_version": dockerImageVersion,
      "facility": facility,
      "environment": environment,
      "scicat_url" : scicatURL,
      "technique_url": techniquesURL,
      "scoring_url" : scoringURL,
      "scoring_enabled" : scoringEnabled,
      "scoring_status" : scoringStatus,
      "scoring_response" : scoringResponse,
      "return_zero_score" : returnZeroScore,
      "pass_documents_to_scoring" : passDocumentsToScoring
    };

    res.send(responseString);
  });


  server.use(router);
};
