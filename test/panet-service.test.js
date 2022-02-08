"use strict";

const expect = require("chai").expect;
const superagent = require("superagent");

describe("PanetOntology", () => {
  let sandbox;
  let panet;
  const env = Object.assign({}, process.env);

  before(() => {
    sandbox = require("sinon").createSandbox();
  });

  beforeEach(() => {
    delete require.cache[require.resolve("../common/panet-service")];
  });

  afterEach(() => {
    sandbox.restore();
    process.env = env;
  });

  after(() => {
    delete require.cache[require.resolve("../common/panet-service")];
    require("../common/panet-service");
  });

  it("Panet", async () => {
    process.env.PANET_BASE_URL = "http://a-url";
    panet = require("../common/panet-service").PanetOntology;
    sandbox.stub(superagent, "get").returns(
      { query: async () => ({ text: "{\"pid\": [\"1\",\"2\",\"3\"]}" }) });
    const res = await panet.panet({ name: "aTechnique" });
    expect(res).to.be.eql({ pid: ["1", "2", "3"] });
  });

  it("Undefined PANET_BASE_URL", () => {
    delete process.env.PANET_BASE_URL;
    panet = require("../common/panet-service").PanetOntology;
    expect(
      panet.panet({ name: "aTechnique" })).to.be.eql({ name: "aTechnique" });
  });

});
