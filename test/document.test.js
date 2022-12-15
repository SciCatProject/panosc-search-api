"use strict";

const expect = require("chai").expect;
const request = require("supertest");
const sandbox = require("sinon").createSandbox();

const mockStubs = require("./MockStubs");
const ScicatService = require("../common/scicat-service");
const ScicatPubDataService = ScicatService.PublishedData;
const ScicatDatasetService = ScicatService.Dataset;
const ScicatSampleService = ScicatService.Sample;

let app;
before((done) => {
  app = require("../server/server");
  done();
});

afterEach((done) => {
  sandbox.restore();
  done();
});

describe("Document", () => {
  const requestUrl = "/api/Documents";
  describe("GET /documents", () => {
    context("without filter", () => {
      it("should return an array of documents", (done) => {
        const findStub = sandbox
          .stub(ScicatPubDataService.prototype, "find")
          .resolves(mockStubs.publishedData.find.noFilter);

        request(app)
          .get(requestUrl)
          .set("Accept", "application/json")
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) throw err;

            expect(res.body).to.be.an("array");
            res.body.forEach((document) => {
              expect(document).to.have.property("pid");
              expect(document).to.have.property("isPublic");
              expect(document).to.have.property("type");
              expect(document).to.have.property("title");
              expect(document).to.have.property("score");
              expect(document).not.to.have.property("thumbnail");
            });
            expect(findStub.args[0][0]).to.be.eql({ fields:{ thumbnail: false } });
            done();
          });
      });
    });

    context("where type is publication and person is James Chadwick", () => {
      it("should return an array of documents matching the type and the person", (done) => {
        const findStub = sandbox
          .stub(ScicatPubDataService.prototype, "find")
          .resolves(mockStubs.publishedData.find.personFilter);
        const callback = sandbox.stub(ScicatDatasetService.prototype, "find");
        callback.onCall(0).resolves(mockStubs.dataset.find.personFilter[0]);
        callback.onCall(1).resolves(mockStubs.dataset.find.personFilter[1]);

        const filter = JSON.stringify({
          where: {
            type: "publication",
          },
          include: [
            {
              relation: "datasets",
            },
            {
              relation: "members",
              scope: {
                include: [
                  {
                    relation: "person",
                    scope: {
                      where: {
                        fullName: "James Chadwick",
                      },
                    },
                  },
                ],
              },
            },
          ],
        });
        request(app)
          .get(requestUrl + "?filter=" + filter)
          .set("Accept", "application/json")
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) throw err;

            expect(res.body).to.be.an("array");
            res.body.forEach((document) => {
              expect(document).to.have.property("pid");
              expect(document).to.have.property("isPublic");
              expect(document).to.have.property("type");
              expect(document).to.have.property("title");
              expect(document).to.have.property("score");
              expect(document).to.have.property("datasets");
              expect(document.datasets).to.be.an("array").and.not.empty;
              expect(document).to.have.property("members");
              expect(document.members).to.be.an("array").and.not.empty;
              expect(document).not.to.have.property("thumbnail");
              document.members.forEach((member) => {
                expect(member.person.fullName).to.equal("James Chadwick");
              });
            });
            expect(findStub.args[0][0]).to.be.eql({
              where: {
                or: [
                  { creator: "James Chadwick" },
                  { authors:"James Chadwick" }
                ]
              },
              fields: { thumbnail: false }
            });
            done();
          });
      });
    });

    context(
      "where parameters has a wavelength in the range 1000-1100 nm",
      () => {
        it("should return an array of documents matching the parameter", (done) => {
          sandbox.stub(ScicatPubDataService.prototype, "find").resolves([]);

          const filter = JSON.stringify({
            include: [
              {
                relation: "parameters",
                scope: {
                  where: {
                    and: [
                      {
                        name: "wavelength",
                      },
                      {
                        value: {
                          between: [1000, 1100],
                        },
                      },
                      {
                        unit: "nm",
                      },
                    ],
                  },
                },
              },
            ],
          });
          request(app)
            .get(requestUrl + "?filter=" + filter)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", /json/)
            .end((err, res) => {
              if (err) throw err;

              expect(res.body).to.be.an("array");
              res.body.forEach((document) => {
                expect(document).to.have.property("pid");
                expect(document).to.have.property("isPublic");
                expect(document).to.have.property("type");
                expect(document).to.have.property("title");
                expect(document).to.have.property("score");
                expect(document).to.have.property("parameters");
                expect(document.parameters).to.be.an("array").and.not.empty;
                document.parameters.forEach((parameter) => {
                  expect(parameter.name).to.equal("wavelength");
                  expect(parameter.value).to.be.within(1000, 1100);
                  expect(parameter.unit).to.equal("nm");
                });
              });
              done();
            });
        });
      },
    );

    context(
      "where dataset parameters has a wavelength in the range 1000-1100 nm",
      () => {
        it("should return an array of documents with datasets matching the parameter", (done) => {
          sandbox
            .stub(ScicatPubDataService.prototype, "find")
            .resolves(mockStubs.publishedData.find.noFilter);
          const callback = sandbox.stub(ScicatDatasetService.prototype, "find");
          callback
            .onCall(0)
            .resolves(mockStubs.dataset.find.wavelengthFilter[0]);
          callback
            .onCall(1)
            .resolves(mockStubs.dataset.find.wavelengthFilter[1]);
          callback
            .onCall(2)
            .resolves(mockStubs.dataset.find.wavelengthFilter[2]);
          callback
            .onCall(3)
            .resolves([mockStubs.dataset.find.wavelengthFilter[3]]);

          const filter = JSON.stringify({
            include: [
              {
                relation: "datasets",
                scope: {
                  include: [
                    {
                      relation: "parameters",
                      scope: {
                        where: {
                          and: [
                            {
                              name: "wavelength",
                            },
                            {
                              value: {
                                between: [1000, 1100],
                              },
                            },
                            {
                              unit: "nm",
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            ],
          });
          request(app)
            .get(requestUrl + "?filter=" + filter)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", /json/)
            .end((err, res) => {
              if (err) throw err;

              expect(res.body).to.be.an("array");
              res.body.forEach((document) => {
                expect(document).to.have.property("pid");
                expect(document).to.have.property("isPublic");
                expect(document).to.have.property("type");
                expect(document).to.have.property("title");
                expect(document).to.have.property("score");
                expect(document).to.have.property("datasets");
                expect(document.datasets).to.be.an("array").and.not.empty;
                document.datasets.forEach((dataset) => {
                  expect(dataset).to.have.property("parameters");
                  expect(dataset.parameters).to.be.an("array").and.not.empty;
                  dataset.parameters.forEach((parameter) => {
                    expect(parameter.name).to.equal("wavelength");
                    expect(parameter.value).to.be.within(1000, 1100);
                    expect(parameter.unit).to.equal("nm");
                  });
                });
              });
              done();
            });
        });
      },
    );

    context(
      "where datasets are using technique x-ray absorption and sample is solid copper cylinder",
      () => {
        it("should return an array of documents with datasets using the technique and sample", (done) => {
          sandbox
            .stub(ScicatPubDataService.prototype, "find")
            .resolves(mockStubs.publishedData.find.noFilter);
          const callback = sandbox.stub(ScicatDatasetService.prototype, "find");
          callback
            .onCall(0)
            .resolves(mockStubs.dataset.find.techniqueSampleFilter[0]);
          callback
            .onCall(1)
            .resolves(mockStubs.dataset.find.techniqueSampleFilter[1]);
          callback
            .onCall(2)
            .resolves(mockStubs.dataset.find.techniqueSampleFilter[2]);
          callback
            .onCall(3)
            .resolves(mockStubs.dataset.find.techniqueSampleFilter[3]);

          sandbox
            .stub(ScicatSampleService.prototype, "find")
            .resolves(mockStubs.sample.find);

          const filter = JSON.stringify({
            include: [
              {
                relation: "datasets",
                scope: {
                  include: [
                    {
                      relation: "samples",
                      scope: {
                        where: {
                          name: "solid copper cylinder",
                        },
                      },
                    },
                    {
                      relation: "techniques",
                      scope: {
                        where: {
                          name: "x-ray absorption",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          });
          request(app)
            .get(requestUrl + "?filter=" + filter)
            .set("Accept", "application/json")
            .expect(200)
            .expect("Content-Type", /json/)
            .end((err, res) => {
              if (err) throw err;

              expect(res.body).to.be.an("array");
              res.body.forEach((document) => {
                expect(document).to.have.property("pid");
                expect(document).to.have.property("isPublic");
                expect(document).to.have.property("type");
                expect(document).to.have.property("title");
                expect(document).to.have.property("score");
                expect(document).to.have.property("datasets");
                expect(document.datasets).to.be.an("array").and.not.empty;
                document.datasets.forEach((dataset) => {
                  expect(dataset).to.have.property("samples");
                  expect(dataset.samples).to.be.an("array").and.not.empty;
                  dataset.samples.forEach((sample) => {
                    expect(sample.name).to.equal("solid copper cylinder");
                  });
                  expect(dataset).to.have.property("techniques");
                  expect(dataset.techniques).to.be.an("array").and.not.empty;
                  dataset.techniques.forEach((technique) => {
                    expect(technique.name).to.equal("x-ray absorption");
                  });
                });
              });
              done();
            });
        });
      },
    );

    context("where datasets have a file matching text `file1`", () => {
      xit("should return an array of documents with datasets and files matching the query", (done) => {
        const filter = JSON.stringify({
          include: [
            {
              relation: "datasets",
              scope: {
                include: [{ relation: "files", scope: { where: { text: "file1" } } }],
              },
            },
          ],
        });
        request(app)
          .get(requestUrl + "?filter=" + filter)
          .set("Accept", "application/json")
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) throw err;

            expect(res.body).to.be.an("array");
            res.body.forEach((document) => {
              expect(document).to.have.property("pid");
              expect(document).to.have.property("isPublic");
              expect(document).to.have.property("type");
              expect(document).to.have.property("title");
              expect(document).to.have.property("score");
              expect(document).to.have.property("datasets");
              expect(document.datasets).to.be.an("array").and.not.empty;
              document.datasets.forEach((dataset) => {
                expect(dataset).to.have.property("files");
                expect(dataset.files).to.be.an("array").and.not.empty;
                dataset.files.forEach((file) => {
                  expect(file.name).to.include("file1");
                });
              });
            });
            done();
          });
      });
    });
  });

  describe("GET /documents/{id}", () => {
    it("should return the document with the requested pid", (done) => {
      const findByIdStub = sandbox
        .stub(ScicatPubDataService.prototype, "findById")
        .resolves(mockStubs.publishedData.findById);

      const pid = "10.5072/panosc-test-publication1";
      request(app)
        .get(requestUrl + "/" + encodeURIComponent(pid))
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/)
        .end((err, res) => {
          if (err) throw err;

          expect(res.body).to.have.property("pid");
          expect(res.body["pid"]).to.equal(pid);
          expect(res.body).to.have.property("isPublic");
          expect(res.body).to.have.property("type");
          expect(res.body).to.have.property("title");
          expect(findByIdStub.args[0][1]).to.be.eql(
            { fields: { thumbnail: false } }
          );
          done();
        });
    });
  });
});
