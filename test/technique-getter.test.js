"use strict";

const expect = require("chai").expect;
const sandbox = require("sinon").createSandbox();
const superagent = require("superagent");

const techniqueGetter = require("../common/technique-getter");


afterEach((done) => {
  sandbox.restore();
  done();
});

describe("BioPortalTechniques", () => {
  const BioPortalTechniques = new techniqueGetter.BioPortalTechniques(
    { url: "http://aUrl.com", apiKey: "aKey" });
  describe("composeURL", () => {
    context(
      "Sets the url, the queryParams and the headers to use",
      () => {
        it("Sets the url, the queryParams and the headers to use", (done) => {
          BioPortalTechniques.composeURL();
          expect(BioPortalTechniques.url instanceof URL).to.true;
          expect(BioPortalTechniques.headers).to.not.be.null;
          expect(BioPortalTechniques.queryParams).to.not.be.null;
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
          const args = { prefLabel: "a bb     cc d" };
          const expected = "a bb cc d";
          expect(BioPortalTechniques.prefLabel(args)).to.be.eql(expected);
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
          const args = { synonym: ["b", "c  d    e"] };
          const expected = ["b", "c d e"];
          expect(BioPortalTechniques.synonym(args)).to.be.eql(expected);
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
          const args = { children: [{ "@id": 1 }, { "@id": 2 }] };
          const expected = [1, 2];
          expect(BioPortalTechniques.children(args)).to.be.eql(expected);
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
          const args = { parents: [
            { prefLabel: null, "@id": 1 },
            { prefLabel: null, "@id": 2 }
          ] };
          const expected = [];
          expect(BioPortalTechniques.parents(args)).to.be.eql(expected);
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
              "@id": 1,
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
          for (var result of BioPortalTechniques.processCollection(args))
            results.push(result);
          expect(results).to.be.eql(expected);
          expect(BioPortalTechniques.collection).to.be.eql(expected);
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
              pid: 1,
              children: [],
              parents: [3, 4]
            },
            {
              pid: 2,
              children: [1, 2],
              parents: []
            }
          ];
          const expected = {
            parents: { 1: [3, 4], 2: [] },
            leaves: [1],
          };
          expect(BioPortalTechniques.buildNodes(args)).to.be.eql(expected);
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
          BioPortalTechniques.getCollection().then(
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
            relatives: { 1: new Set([1, 2]), 2: new Set([2]) },
            collection:
              [
                {
                  prefLabel: "a",
                  pid: 1,
                  synonym: ["A"],
                  children: [2],
                  parents: []
                },
                {
                  prefLabel: "b",
                  pid: 2,
                  synonym: [],
                  children: [],
                  parents: [1]
                }
              ]
          };
          sandbox.stub(BioPortalTechniques, "getCollection").resolves(
            args);
          BioPortalTechniques.build().then(data => {
            expect(data.collection).to.be.eql(expected.collection);
            expect(data.relatives).to.be.eql(expected.relatives);
          });
          done();
        });
      }
    );
  });

});

describe("GitHubOwlTechnique", () => {
  let GitHubOwlTechnique;
  beforeEach(() => {
    GitHubOwlTechnique = new techniqueGetter.GitHubOwlTechnique({
      repoURL: "http://aurl", file: "aFile", commit: "aCommit"
    });
  });

  const xmlMock = require("./MockStubs").xmlContent;
  const querySelectorMock =  require("./MockStubs").querySelectorXml;

  describe("composeURL", () => {
    const expectedURL = "http://aurl/aCommit/aFile";
    const tests = [
      {
        args: new techniqueGetter.GitHubOwlTechnique({
          repoURL: "http://aurl", file: "aFile", commit: "aCommit"
        }),
        expected: expectedURL,
        message: "without /"
      },
      {
        args: new techniqueGetter.GitHubOwlTechnique({
          repoURL: "http://aurl/", file: "aFile", commit: "aCommit"
        }),
        expected: expectedURL,
        message: "with /"
      }
    ];
    tests.forEach(({ args, expected, message }) => {
      context(
        `Composes an url based on the config file ${message}`,
        () => {
          it(`${message}`,
            (done) => {
              args.composeURL();
              expect(args.url.toString()).to.be.eql(expected);
              done();
            });
        }
      );
    });
  });

  describe("getCollection", () => {
    it("checks the length of the returned collection", (done) => {
      sandbox.stub(
        superagent, "get").returns({ text: xmlMock });
      GitHubOwlTechnique.getCollection().then(data =>
        expect(data.length).to.be.eql(3)
      );
      done();
    });
  });

  describe("pid", () => {
    it("checks the pid from the xml queried file", (done) => {
      const item = querySelectorMock[0];
      expect(GitHubOwlTechnique.pid(item)).to.be.eql("class1");
      done();
    });
  });

  describe("prefLabel", () => {
    const tests = [
      {
        args: querySelectorMock[0],
        expected: "label1", message: "from label"
      },
      {
        args: querySelectorMock[1],
        expected: "label2", message: "from about split"
      }
    ];
    tests.forEach(({ args, expected, message }) => {
      it(`${message}`, (done) => {
        expect(GitHubOwlTechnique.prefLabel(args)).to.be.eql(expected);
        done();
      });
    });
  });

  describe("synonym", () => {
    it("checks the synonym from the xml queried file", (done) => {
      const item = querySelectorMock[1];
      expect(GitHubOwlTechnique.synonym(item)).to.be.eql(
        ["synonym1", "synonym2"]);
      done();
    });
  });

  describe("parents", () => {
    it("checks the synonym from the xml queried file", (done) => {
      const item = querySelectorMock[2];
      const parents = ["class1", "http://class2/label2"];
      expect(GitHubOwlTechnique.parents(item)).to.be.eql(parents);
      expect(GitHubOwlTechnique.parentsSet).to.be.eql(new Set(parents));
      done();
    });
  });

  describe("filterLeaves", () => {
    it("Returns the pids of the leaves and appends to an array", (done) => {
      GitHubOwlTechnique.collection = [{ pid: 1 }, { pid:2 }, { pid:3 }];
      GitHubOwlTechnique.parentsSet = new Set([1, 2]);
      expect(GitHubOwlTechnique.filterLeaves()).to.be.eql([3]);
      done();
    });
  });

  describe("build", () => {
    it("builds nodes from the xml file", (done) => {
      const expected = {
        collection: [
          {
            pid: "class1", prefLabel: "label1",
            parents: [], synonym: []
          },
          {
            pid: "http://class2/label2", prefLabel: "label2",
            parents: ["class1"], synonym: ["synonym1", "synonym2"]
          },
          {
            pid: "class3", prefLabel: "label3",
            parents: ["class1", "http://class2/label2"], synonym: []
          }
        ],
        relatives: {
          class1: new Set(["class1", "http://class2/label2", "class3"]),
          "http://class2/label2": new Set(["http://class2/label2", "class3"]),
          class3: new Set(["class3"])
        }
      };
      sandbox.stub(GitHubOwlTechnique, "getCollection").resolves(
        querySelectorMock);
      GitHubOwlTechnique.build().then(data => {
        expect(data.collection).to.be.eql(expected.collection);
        expect(data.relatives).to.be.eql(expected.relatives);
      });
      done();
    });

  });

});
