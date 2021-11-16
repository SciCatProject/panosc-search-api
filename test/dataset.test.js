"use strict";

const expect = require("chai").expect;
const request = require("supertest");
const sandbox = require("sinon").createSandbox();

const mockStubs = require("./MockStubs");
const ScicatService = require("../common/scicat-service");
const ScicatDatasetService = ScicatService.Dataset;

let app;
before((done) => {
  app = require("../server/server");
  done();
});

afterEach((done) => {
  sandbox.restore();
  done();
});

describe("Dataset", () => {
  const requestUrl = "/panosc-api/Datasets";
  describe("GET /datasets", () => {
    context("without filter", () => {
      it("should return en array of datasets", (done) => {
        sandbox
          .stub(ScicatDatasetService.prototype, "find")
          .resolves(mockStubs.dataset.find.noFilter);

        request(app)
          .get(requestUrl)
          .set("Accept", "application/json")
          .expect(200)
          .expect("Content-Type", /json/)
          .end((err, res) => {
            if (err) throw err;

            expect(res.body).to.be.an("array");
            res.body.forEach((dataset) => {
              expect(dataset).to.have.property("pid");
              expect(dataset).to.have.property("title");
              expect(dataset).to.have.property("isPublic");
              expect(dataset).to.have.property("creationDate");
              expect(dataset).to.have.property("score");
            });
            done();
          });
      });
    });

    context("where technique is x-ray absorption", () => {
      it("should return en array of datasets matching the technique", (done) => {
        sandbox
          .stub(ScicatDatasetService.prototype, "find")
          .resolves(mockStubs.dataset.find.techniquesFilter);

        const filter = JSON.stringify({
          include: [
            {
              relation: "techniques",
              scope: {
                where: {
                  name: "x-ray absorption",
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
            res.body.forEach((dataset) => {
              expect(dataset).to.have.property("pid");
              expect(dataset).to.have.property("title");
              expect(dataset).to.have.property("isPublic");
              expect(dataset).to.have.property("creationDate");
              expect(dataset).to.have.property("score");
              expect(dataset).to.have.property("techniques");
              expect(dataset.techniques).to.be.an("array").and.not.empty;
              dataset.techniques.forEach((technique) => {
                expect(technique.name).to.equal("x-ray absorption");
              });
            });
            done();
          });
      });
    });

    const renameKeys = (ds, init = {}, nameMap = { value: "v", unit: "u" }) =>
      Object.keys(ds).reduce((o, k) => (
        typeof ds[k] === "object" && ds[k] !== null
          ? (o[nameMap[k] || k] = {}, renameKeys(ds[k], o[nameMap[k] || k]))
          : o[nameMap[k] || k] = ds[k],
        o
      ),
      init);

    const testsPhotonEnergy = [
      {
        args: mockStubs.dataset.find.photonEnergyFilter,
        message: "value and unit inside scientificMetadata"
      },
      {
        args: mockStubs.dataset.find.photonEnergyFilter.map(
          dataset => renameKeys(dataset)
        ),
        message: "v and u inside scientificMetadata"
      }
    ];

    testsPhotonEnergy.forEach(({ args, message }) => {
      context(
        "where parameters has a photon energy in the range 880-990 eV",
        () => {
          it(`should return en array of datasets matching the parameter from ${message}`, (done) => {
            sandbox
              .stub(ScicatDatasetService.prototype, "find")
              .resolves(args);

            const filter = JSON.stringify({
              include: [
                {
                  relation: "parameters",
                  scope: {
                    where: {
                      and: [
                        {
                          name: "photon_energy",
                        },
                        {
                          value: {
                            between: [880, 990],
                          },
                        },
                        {
                          unit: "eV",
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
                res.body.forEach((dataset) => {
                  expect(dataset).to.have.property("pid");
                  expect(dataset).to.have.property("title");
                  expect(dataset).to.have.property("isPublic");
                  expect(dataset).to.have.property("creationDate");
                  expect(dataset).to.have.property("score");
                  expect(dataset).to.have.property("parameters");
                  expect(dataset.parameters).to.be.an("array").and.not.empty;
                  dataset.parameters.forEach((parameter) => {
                    expect(parameter.name).to.equal("photon_energy");
                    expect(parameter.value).to.be.within(880, 990);
                    expect(parameter.unit).to.equal("eV");
                  });
                });
                done();
              });
          });
        },
      );
    });

    const testsSolidCopper = [
      {
        args: mockStubs.dataset.find.solidCopperFilter,
        message: "value and unit inside scientificMetadata"
      },
      {
        args: mockStubs.dataset.find.solidCopperFilter.map(
          dataset => renameKeys(dataset)
        ),
        message: "v and u inside scientificMetadata"
      }
    ];
    testsSolidCopper.forEach(({ args, message }) => {
      context(
        "where parameters includes a solid sample containing copper",
        () => {
          it(`should return an array of datasets matching the parameter from ${message}`, (done) => {
            sandbox
              .stub(ScicatDatasetService.prototype, "find")
              .resolves(args);

            const filter = JSON.stringify({
              include: [
                {
                  relation: "parameters",
                  scope: {
                    where: {
                      or: [
                        {
                          and: [
                            {
                              name: "sample_state",
                            },
                            {
                              value: "solid",
                            },
                          ],
                        },
                        {
                          and: [
                            {
                              name: "chemical_formula",
                            },
                            {
                              value: "Cu",
                            },
                          ],
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
                res.body.forEach((dataset) => {
                  expect(dataset).to.have.property("pid");
                  expect(dataset).to.have.property("title");
                  expect(dataset).to.have.property("isPublic");
                  expect(dataset).to.have.property("creationDate");
                  expect(dataset).to.have.property("score");
                  expect(dataset).to.have.property("parameters");
                  expect(dataset.parameters).to.be.an("array").and.not.empty;
                  expect(dataset.parameters).to.deep.include.any.members([{ "name": "chemical_formula", "value": "Cu", "unit": "" }, { "name": "sample_state", "value": "solid", "unit": "" }]);
                });
                done();
              });
          });
        },
      );
    });

    context("where parameters has a temperature below 80 °C", () => {
      it("should return en array of datasets matching the parameter", (done) => {
        sandbox
          .stub(ScicatDatasetService.prototype, "find")
          .resolves(mockStubs.dataset.find.temperatureFilter);

        const filter = JSON.stringify({
          include: [
            {
              relation: "parameters",
              scope: {
                where: {
                  and: [
                    {
                      name: "temperature",
                    },
                    {
                      value: {
                        lt: 80,
                      },
                    },
                    {
                      unit: "celsius",
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
            res.body.forEach((dataset) => {
              expect(dataset).to.have.property("pid");
              expect(dataset).to.have.property("title");
              expect(dataset).to.have.property("isPublic");
              expect(dataset).to.have.property("creationDate");
              expect(dataset).to.have.property("score");
              expect(dataset).to.have.property("parameters");
              expect(dataset.parameters).to.be.an("array").and.not.empty;
              dataset.parameters.forEach((parameter) => {
                expect(parameter.name).to.equal("temperature");
                expect(parameter.value).to.be.lessThan(80);
                expect(parameter.unit).to.equal("celsius");
              });
            });
            done();
          });
      });
    });

    context("where file matches text `file1`", () => {
      xit("should return en array of datasets matching the query", (done) => {
        const filter = JSON.stringify({
          include: [
            {
              relation: "files",
              scope: {
                where: {
                  text: "file1",
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
            res.body.forEach((dataset) => {
              expect(dataset).to.have.property("pid");
              expect(dataset).to.have.property("title");
              expect(dataset).to.have.property("isPublic");
              expect(dataset).to.have.property("creationDate");
              expect(dataset).to.have.property("score");
              expect(dataset).to.have.property("files");
              expect(dataset.files).to.be.an("array").and.not.empty;
              dataset.files.forEach((file) => {
                expect(file.name).to.include("file1");
              });
            });
            done();
          });
      });
    });
  });

  describe("GET /datasets/{id}", () => {
    it("should return the dataset with the requested id", (done) => {
      sandbox
        .stub(ScicatDatasetService.prototype, "findById")
        .resolves(mockStubs.dataset.findById);

      const pid = "20.500.12269/panosc-dataset1";
      request(app)
        .get(requestUrl + "/" + encodeURIComponent(pid))
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/)
        .end((err, res) => {
          if (err) throw err;

          expect(res.body).to.have.property("pid");
          expect(res.body["pid"]).to.equal(pid);
          expect(res.body).to.have.property("title");
          expect(res.body).to.have.property("isPublic");
          expect(res.body).to.have.property("creationDate");
          done();
        });
    });
  });
});
