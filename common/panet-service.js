"use strict";

const superagent = require("superagent");

class Panet {

  constructor(baseUrl) {
    this.panetUrl = baseUrl + "/techniques/pan-ontology";
  }

  /**
   * request panet ontology to pan-ontologies service
   * @param {object} techniqueLoopbackWhere Loopback where filter with condition
   *  on a field of the technique model
   * @returns {object} Loopback where filter made of condition on list of pids:
   * e.g {and:[{pid:{inq: [1,2,3]}, {pid: {inq: [4,5,6]}}]}
   * or {or:[{pid:{inq: [1,2,3]}, {pid: {inq: [4,5,6]}}]}
   * or {pid:{inq: [1,2,3]}}
   */
  async panet(techniqueLoopbackWhere) {

    console.log(">>> Panet.panet: panet requested");
    console.log(" - where filter : ", techniqueLoopbackWhere);

    // const res = await superagent
    //   .get(this.panetUrl)
    //   .query({ where : JSON.stringify(techniqueLoopbackWhere) });

    // const newTechniqueLoopbackWhere = JSON.parse(res.text);
    // console.log(" - where filter : ", newTechniqueLoopbackWhere);
    // return newTechniqueLoopbackWhere;

    return superagent
      .get(this.panetUrl)
      .query({ where : JSON.stringify(techniqueLoopbackWhere) }).then( res => {
        const newTechniqueLoopbackWhere = JSON.parse(res.text);
        console.log(" + where filter : ", newTechniqueLoopbackWhere);
        return newTechniqueLoopbackWhere;
      }).catch(e=> {
        console.log("fail", e);
      });


  }

}

exports.PanetOntology = process.env.PANET_BASE_URL ?
  new Panet(process.env.PANET_BASE_URL) :
  { panet: (techniqueLoopbackWhere) => techniqueLoopbackWhere };
