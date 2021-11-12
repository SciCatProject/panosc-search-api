"use strict";

const expect = require("chai").expect;
const sandbox = require("sinon").createSandbox();

const BioPortalLoopbackCacheBuilder = require(
  "../common/technique-filter-builder").BioPortalLoopbackCacheBuilder;

afterEach((done) => {
  sandbox.restore();
  done();
});

describe("BioPortalLoopbackCacheBuilder", () => {
  const techniqueCache = new BioPortalLoopbackCacheBuilder(
    {
      url: "http://aUrl.com", apiKey: "aKey",
      cache: { sttl: 10, collection: "Technique" }
    });

  describe("prepareForCache", () => {
    context(
      `Tranforms an object with the structure of BioPortalTechniques to
          a format that can be used by LoopbackCache`,
      () => {
        it("A generator with a format that can be used by LoopbackCache",
          (done) => {
            const args = {
              nodes: { relatives: { 1: new Set([2, 3]), 2: new Set([3, 4]) } },
              collection: [
                { "@id": 1, prefLabel: "a", synonym: ["A"], aField: "f" },
                { "@id": 2, prefLabel: "b", synonym: ["B"] }]
            };
            const expected = [
              {
                pid: 1, name: "a", synonym: ["A"],
                relatives: [2, 3], createdAt: "now"
              },
              {
                pid: 2, name: "b", synonym: ["B"],
                relatives: [3, 4], createdAt: "now"
              }
            ];

            sandbox.stub(Date, "now").returns("now");

            const results = [];
            for (var result of techniqueCache.constructor.prepareForCache(args))
              results.push(result);
            expect(results).to.be.eql(expected);
            done();
          });
      }
    );
  });

  describe("createSynonym", () => {
    const tests = [{
      args: { name: "a", pid: 1 },
      expected: { synonym: "a", pid: 1 },
      message: "replacing name with synonym"
    },
    {
      args: { pid: 2 },
      expected: null,
      message: "returning null as NAME key is missing"
    }
    ];
    tests.forEach(({ args, expected, message }) => {
      context(
        `Returns the same filter structure used by the NAME field, ${message}`,
        () => {
          it(`${message}`,
            (done) => {
              expect(
                techniqueCache.constructor.createSynonym(args)).to.be.eql(
                expected);
              done();
            });
        }
      );
    });
  });

  describe("flat", () => {
    context(
      `Starting from loopback filter it adds synonym to it and returns the
      relatives`,
      () => {
        it(`Object the filter + synonym, joined by an OR condition, and returns
        the relatives`,
        (done) => {
          const args = { name: "a", pid: 1 };
          const expected = [1, 2, 3, 4];
          const mock = sandbox.stub(techniqueCache,
            "buildTechniques").returns([
            { relatives: [1, 2] },
            { relatives: [3, 4] }]);
          techniqueCache.flat(args).then(
            data => {
              expect(data).to.be.eql(expected);
              expect(mock.calledWith({
                or: [
                  { name: "a", pid: 1 },
                  { synonym: "a", pid: 1 }]
              })).to.true;
            });
          done();
        }
        );
      });
  });

  describe("and", () => {
    context(
      `Starting from loopback AND filter it adds synonym to it and returns the
      intersection of relatives`,
      () => {
        it(`Object the filter + synonym, joined by an OR condition, and returns
        the intersection of relatives`,
        (done) => {
          const args = [{ name: "a", pid: 1 }, { pid: 2 }];
          const mock = sandbox.stub(
            techniqueCache, "buildTechniques").onCall(0).returns([
            { relatives: [1, 2] },
            { relatives: [3, 4] }]
          ).onCall(1).returns([
            { relatives: [2, 5] },
            { relatives: [1, 7] }]
          );
          const expected = { and: [
            { pid: { inq: [1, 2, 3, 4] } },
            { pid: { inq: [2, 5, 1, 7] } }
          ] };
          techniqueCache.and(args).then(
            data => {
              expect(data).to.be.eql(expected);
              expect(mock.getCall(0).calledWith({
                or: [
                  { name: "a", pid: 1 },
                  { synonym: "a", pid: 1 }
                ]
              })).to.true;
              expect(mock.getCall(1).calledWith({ pid: 2 })).to.true;
            });
          done();
        }
        );
      });
  });

  describe("buildFilter", () => {
    const tests = [
      {
        args: { and: { name: "a", pid: 1 } },
        expected: "and",
        message: "AND"
      },
      {
        args: { or: { name: "a", pid: 1 } },
        expected: "or",
        message: "OR"
      },
      {
        args: { name: "a", pid: 1 },
        expected: "flat",
        message: "FLAT"
      }
    ];
    tests.forEach(({ args, expected, message }) => {
      context(
        `Returns Loopback filter with relatives from ${message} filtered
        LoopbacCache or BioPortal in INQ clause`,
        () => {
          it(`${message}`,
            (done) => {
              const mock = sandbox.stub(techniqueCache, expected).returns([]);
              techniqueCache.buildFilter(args).then(() =>
                expect(mock.callCount).to.be.eql(1)
              );
              done();
            });
        }
      );
    });
  });

  describe("buildTechniques", () => {
    context(
      "Builds the items from filtered LoopbacCache or BioPortal",
      () => {
        it("Array of objects from filtered LoopbacCache or BioPortal",
          (done) => {
            const args = { name: "a", pid: 1 };
            sandbox.stub(techniqueCache.techniqueGetter, "build");
            techniqueCache.techniqueGetter.nodes = { relatives: { 1: [1, 2] } };
            techniqueCache.techniqueGetter.collection = [{
              "@id": 1, prefLabel: "a", synonym: ["A"], aField: "f"
            }];
            const expected = {
              pid: 1, name: "a", synonym: ["A"],
              relatives: [1, 2], createdAt: 10
            };
            sandbox.stub(Date, "now").returns(10);
            sandbox.stub(techniqueCache.cache, "get").returns([]);
            const mock = sandbox.stub(techniqueCache.cache, "set");
            techniqueCache.buildTechniques(args).then(
              () => {
                expect(mock.args[0][1].next().value
                ).to.be.eql(expected);
              }
            );
            done();
          });
      }
    );
  });

});
