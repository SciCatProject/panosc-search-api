"use strict";

const expect = require("chai").expect;
const sandbox = require("sinon").createSandbox();
const superagent = require("superagent");


const BioPortalTechniques = require(
  "../common/technique-getter").BioPortalTechniques;
afterEach((done) => {
  sandbox.restore();
  done();
});

describe("BioPortalTechniques", () => {
  const technique = new BioPortalTechniques(
    { url: "http://aUrl.com", apiKey: "aKey" });
  describe("composeURL", () => {
    context(
      "Sets the url, the queryParams and the headers to use",
      () => {
        it("Sets the url, the queryParams and the headers to use", (done) => {
          technique.composeURL();
          expect(technique.url instanceof URL).to.true;
          expect(technique.headers).to.not.be.null;
          expect(technique.queryParams).to.not.be.null;
          done();
        });
      }
    );
  });


  describe("prefLabel", () => {
    context(
      "Returns the item with extra spaces removed",
      () => {
        it("Item with extra spaces removed", (done) => {
          const args = "a bb     cc d";
          const expected = "a bb cc d";
          expect(technique.constructor.prefLabel(args)).to.be.eql(expected);
          done();
        });
      }
    );
  });

  describe("synonym", () => {
    context(
      "Returns the item removing extra spaces",
      () => {
        it("Item removing extra spaces", (done) => {
          const args = ["b", "c  d    e"];
          const expected = ["b", "c d e"];
          expect(technique.constructor.synonym(args)).to.be.eql(expected);
          done();
        });
      }
    );
  });

  describe("children", () => {
    context(
      "Returns the item unpacking the array of objects",
      () => {
        it("Item unpacking the array of objects", (done) => {
          const args = [{ "@id": 1 }, { "@id": 2 }];
          const expected = [1, 2];
          expect(technique.constructor.children(args)).to.be.eql(expected);
          done();
        });
      }
    );
  });

  describe("parents", () => {
    context(
      "Returns the item unpacking the array of objects",
      () => {
        it("Item unpacking the array of objects", (done) => {
          const args = [
            { prefLabel: null, "@id": 1 },
            { prefLabel: null, "@id": 2 }
          ];
          const expected = [];
          expect(technique.constructor.parents(args)).to.be.eql(expected);
          done();
        });
      }
    );
  });


  describe("processCollection", () => {
    context(
      "Returns a generator with processed lines",
      () => {
        it("Generator with  processed lines", (done) => {
          const args = [
            {
              prefLabel: "a",
              pid: 1,
              synonym: ["aa    b b", "c"],
              children: [{ "@id": 1 }, { "@id": 2 }],
              parents: [
                { prefLabel: null, "@id": 3 }, { prefLabel: "d", "@id": 4 }]
            }
          ];
          const expected = [
            {
              prefLabel: "a",
              pid: 1,
              synonym: ["aa b b", "c"],
              children: [1, 2],
              parents: [3, 4]
            }
          ];
          const results = [];
          for (var result of technique.processCollection(args))
            results.push(result);
          expect(results).to.be.eql(expected);
          expect(technique.collection).to.be.eql(expected);
          done();
        });
      }
    );
  });

  describe("buildNodes", () => {
    context(
      `Creates an object where firstKey is the type of object and as value a
      second object with an id and the value`,
      () => {
        it(`Object where firstKey is the type of object and as value a second
        object with an id and the value`, (done) => {
          const args = [
            {
              prefLabel: "a",
              "@id": 1,
              synonym: ["aa", "c"],
              children: [],
              parents: [3, 4]
            },
            {
              prefLabel: "b",
              "@id": 2,
              synonym: [],
              children: [1, 2],
              parents: []
            }
          ];
          const expected = {
            names: { 1: "a", 2: "b" },
            "@id": { a: 1, b: 2 },
            children: { 1: [], 2: [1, 2] },
            parents: { 1: [3, 4], 2: [] },
            synonym: { 1: ["aa", "c"], 2: [] },
            synonymT: { "aa": 1, "c": 1 },
            leaves: [1],
            roots: [2]
          };
          expect(technique.constructor.buildNodes(args)).to.be.eql(expected);
          done();
        });
      }
    );
  });

  describe("getCollection", () => {
    context(
      "Concats together the responses of BioPortal from different pages",
      async () => {
        it("Responses of BioPortal from different pages", (done) => {
          const stubReturn = {
            query: () => {
              return {
                set: () => {
                  return new Promise((resolve) => {
                    resolve({ text: "{\"collection\":[1,2],\"pageCount\":4}" });
                  });
                }
              };
            }
          };
          const mock = sandbox
            .stub(superagent, "get");
          mock.returns(stubReturn);
          technique.getCollection().then(
            () => expect(mock.callCount).to.be.eql(4)
          );
          done();
        });
      }
    );
  });

  describe("build", () => {
    context(
      `Builds and sets a graph with key the id of the BioPortal item and value
      the relatives (ancestor or descendants)`,
      () => {
        it(`Sets a graph with key the id of the BioPortal item and value the 
        relatives (ancestor or descendants)`, (done) => {
          const args = [
            {
              prefLabel: " a ",
              "@id": 1,
              synonym: [" A "],
              children: [{ "@id": 2 }],
              parents: [
                { prefLabel: null, "@id": null },
                { prefLabel: null, "@id": null }]
            },
            {
              prefLabel: "b",
              "@id": 2,
              synonym: [],
              children: [],
              parents: [{ prefLabel: "a", "@id": 1 }]
            }
          ];
          const expected = {
            nodes: {
              names: { 1: "a", 2: "b" },
              "@id": { a: 1, b: 2 },
              children: { 1: [2], 2: [] },
              parents: { 1: [], 2: [1] },
              synonym: { 1: ["A"], 2: [] },
              synonymT: { "A": 1 },
              leaves: [2],
              roots: [1],
              relatives: { 1: new Set([1, 2]), 2: new Set([2]) }
            },
            collection:
              [
                {
                  prefLabel: "a",
                  "@id": 1,
                  synonym: ["A"],
                  children: [2],
                  parents: []
                },
                {
                  prefLabel: "b",
                  "@id": 2,
                  synonym: [],
                  children: [],
                  parents: [1]
                }
              ]
          };
          sandbox.stub(technique, "getCollection").resolves(
            args);
          technique.build().then(data => {
            expect(data.collection).to.be.eql(expected.collection);
            expect(data.nodes).to.be.eql(expected.nodes);
          });
          done();
        });
      }
    );
  });

});
