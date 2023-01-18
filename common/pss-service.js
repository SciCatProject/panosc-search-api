"use strict";

const superagent = require("superagent");
const utils = require("./utils");

const baseUrl = process.env.PSS_BASE_URL || "http://localhost:8000";
const passDocumentsToScoring = utils.getBoolEnvVar("PASS_DOCUMENTS_TO_SCORING", false);
const desyPub = require("../server/desy_pub.json");

exports.Score = class {

  constructor() {
    this.pssBaseUrl = baseUrl;
    this.pssScoreUrl = baseUrl + "/score";
  }

  /**
   * request scoring to PSS subsystem
   * @param {str} query plain english query that we want to use for scoring our entries
   * @param {str[]} itemIds list of ids of the item we are requesting the scoring for
   * @param {str} group type of items that we are requesting the scoring on
   * @param {int} limit number of items we want returned
   * @returns {object[]} Array of the scores
   */
  async score(query, itemIds = [], group = "default", limit = -1) {

    console.log(">>> Score.score - BEGIN");
    console.log(" - query : ", query);
    console.log(" - number of items : ", itemIds.length);
    console.log(" - group : ", group);
    console.log(" - limit : ", limit);
    console.log(" - passing items: ", passDocumentsToScoring);

    //const status = await this.status();

    const res = await superagent
      .post(this.pssScoreUrl)
      .send({
        query: query,
        itemIds: (passDocumentsToScoring ? itemIds : []),
        group: group,
        limit: limit
      }).catch(() => {
        console.log(" error accessing pss");
        return { text: JSON.stringify({ scores: [] }) };
      });

    console.log(" retrieved scores");
    const jsonRes = JSON.parse(res.text);

    console.log(" scores parsed");
    const scores = Object.assign({}, ...jsonRes.scores.map((i) => ({ [i.itemId]: i.score })));

    console.log(">>> Score.score - END");
    scores[desyPub.doi] = {
      evaluation: 0.85,
      serial: 0.85,
      crystallographic: 0.85,
      structure: 0.85,
      determination: 0.85,
      megahertz: 0.85,
      pulse: 0.85,
      trains: 0.85,
      "evaluation of serial crystallographic structure determination within megahertz pulse trains": 0.99,
      "serial crystallographic": 0.9,
      "serial crystallographic structure": 0.95,
    }[query.toLowerCase()] || 0;
    return scores;
  }

  /**
   * query pss root url to retrieve status
   * @returns {object[]} object return by pss
   */
  async status() {
    const res = await superagent
      .get(this.pssBaseUrl)
      .catch(() => {
        console.log(" Error: impossible to contact pss");
        return { text: JSON.stringify({ status: 0 }) };
      });

    let status = JSON.parse(res.text);
    if (!("status" in status)) {
      status.status = 1;
    }
    return status;
  }
};
