"use strict";

const expect = require("chai").expect;
const utils = require("../common/utils");

describe("utils", () => {
  describe("getInclusions", () => {
    const tests = [
      { args: undefined, expected: {}, message: "empty" },
      {
        args: { include: [{ relation: "aRelation" }] },
        expected: { aRelation: {} },
        message: "with primary relation as key and empty object as value",
      },
      {
        args: {
          include: [{ relation: "aRelation", scope: { where: "aWhere" } }],
        },
        expected: { aRelation: { where: "aWhere" } },
        message:
          "with primary relation as key and where condition from scope as value",
      },
    ];
    tests.forEach(({ args, expected, message }) => {
      context(`${message}`, () => {
        it(`should return an object ${message}`, (done) => {
          const inclusions = utils.getInclusions(args);
          expect(inclusions).to.eql(expected);
          done();
        });
      });
    });
  });

  describe("getInclusionNames", () => {
    const tests = [
      { args: {}, expected: {}, message: "empty" },
      {
        args: { include: [{ relation: "aRelation" }] },
        expected: {},
        message: "empty caused by missing where or include in scope",
      },
      {
        args: {
          include: [{ relation: "aRelation", scope: { where: "aWhere" } }],
        },
        expected: { aRelation: [] },
        message:
          "with primary relation as key and and empty array as value caused by missing second level include",
      },
      {
        args: {
          include: [
            {
              relation: "aRelation",
              scope: { include: [{ relation: "aRelation1" }] },
            },
          ],
        },
        expected: { aRelation: [] },
        message:
          "with primary relation as key and and empty array as value caused by missing scope in second level include",
      },
      {
        args: {
          include: [
            {
              relation: "aRelation",
              scope: {
                include: [{ relation: "aRelation1", scope: "aScope" }],
              },
            },
          ],
        },
        expected: { aRelation: [] },
        message:
          "with primary relation as key and and empty array as value caused by missing where in scope in second level include",
      },
      {
        args: {
          include: [
            {
              relation: "aRelation",
              scope: {
                include: [
                  { relation: "aRelation1", scope: { where: "aWhere1" } },
                ],
              },
            },
          ],
        },
        expected: { aRelation: ["aRelation1"] },
        message:
          "with primary relation as key and an array of secondary relations as value",
      },
    ];
    tests.forEach(({ args, expected, message }) => {
      context(`${message}`, () => {
        it(`should return an object ${message}`, (done) => {
          const inclusions = utils.getInclusionNames(args);
          expect(inclusions).to.eql(expected);
          done();
        });
      });
    });
  });

  describe("filterObjectsEmptyValues", () => {
    const tests = [
      {
        args: [{ a: undefined, b: undefined }],
        expected: [],
        message: "an empty array of objects caused by all undefined values",
      },
      {
        args: [
          { a: 0, b: 1 },
          { a: undefined, b: undefined },
        ],
        expected: [{ a: 0, b: 1 }],
        message: "a reduced array of objects casued by some undefined values",
      },
      {
        args: { a: undefined, b: undefined },
        expected: {},
        message: "an empty object caused by all undefined values",
      },
      {
        args: { a: undefined, b: 0 },
        expected: { a: undefined, b: 0 },
        message: "an object caused by some undefined values",
      },
    ];
    tests.forEach(({ args, expected, message }) => {
      context(`${message}`, () => {
        it(`should return a ${message}`, (done) => {
          const inclusions = utils.filterObjectsEmptyValues(args);
          expect(inclusions).to.eql(expected);
          done();
        });
      });
    });
  });

  describe("filterOnPrimary", () => {
    context("Sanitized result based on primary relation", () => {
      it("should return the input array removing the elements having an empty primary relation value", (done) => {
        const filtered = utils.filterOnPrimary(
          [
            { aRelation: [] },
            { aRelation: {} },
            { aRelation: [0] },
            { aRelation: { a: 0 } },
            { aRelation: [{ a: undefined }, { a: undefined }] },
            { aRelation: { a: undefined } },
            { aRelation1: [], aRelation: [0] },
          ],
          "aRelation"
        );
        expect(filtered).to.eql([
          { aRelation: [0] },
          { aRelation: { a: 0 } },
          { aRelation1: [], aRelation: [0] },
        ]);
        done();
      });
    });
  });

  describe("filterOnSecondary", () => {
    context("Sanitized result based on primary and secondary relation", () => {
      it("should return the input list removing the elements having an empty secondary relation value", (done) => {
        const input = [
          { a: 0, aRelation: [{ aRelation1: { b: undefined, c: undefined } }] },
          {
            a: 0,
            aRelation: [
              { aRelation1: { b: undefined, c: undefined } },
              { aRelation1: { b: undefined, c: 0 } },
            ],
          },
          { a: 0, aRelation: [{ aRelation1: [] }] },
          { a: 0, aRelation: [{ aRelation1: [0] }] },
          { a: 0, aRelation: { aRelation1: [] } },
          {
            a: 0,
            aRelation: { aRelation1: [1, { b: undefined, c: undefined }] },
          },
          { a: 0, aRelation: { aRelation1: { b: undefined, c: undefined } } },
          { a: 0, aRelation: { aRelation1: { b: undefined, c: 0 } } },
          {
            a: 0,
            aRelation: { aRelation1: { b: undefined, c: 0 }, aRelation2: 1 },
          },
        ];
        const expected = [
          { a: 0, aRelation: [{ aRelation1: { b: undefined, c: 0 } }] },
          { a: 0, aRelation: [{ aRelation1: [0] }] },
          { a: 0, aRelation: { aRelation1: [1] } },
          { a: 0, aRelation: { aRelation1: { b: undefined, c: 0 } } },
          {
            a: 0,
            aRelation: { aRelation1: { b: undefined, c: 0 }, aRelation2: 1 },
          },
        ];
        const filtered = utils.filterOnSecondary(
          input,
          "aRelation",
          "aRelation1"
        );
        expect(filtered).to.eql(expected);
        done();
      });
    });
  });

  describe("convertToSI", () => {
    context("Convert a quantity to SI units", () => {
      it("Object with with the converted value as `valueSI` and the converted unit as `unitSI`", (done) => {
        expect(utils.convertToSI(1000, "mm")).to.eql({
          valueSI: 1,
          unitSI: "m",
        });
        done();
      });
    });
  });

  describe("convertToUnit", () => {
    context("Convert a quantity to another unit", () => {
      it("Object with the converted value and unit", (done) => {
        expect(utils.convertToUnit(1, "m", "mm")).to.eql({
          value: 1000,
          unit: "mm",
        });
        done();
      });
    });
  });

  describe("extractParamaterFilter", () => {
    context(
      "Extracts the name, value and unit from parameter where filter",
      () => {
        it("Object with the extracted name, value and unit", (done) => {
          const input = {
            and: [{ name: "aName" }, { value: "aValue" }, { unit: "aUnit" }],
          };
          const expected = { name: "aName", value: "aValue", unit: "aUnit" };
          expect(utils.extractParamaterFilter(input)).to.eql(expected);
          done();
        });
      }
    );
  });
});

describe("extractParamaterFilterMapping", () => {
  describe("extractParamaterFilter", () => {
    context(
      "Creates an object with the name of the parameter as key and values from extractParamaterFilter",
      () => {
        it("Object with name as key and values from extractParamaterFilter", (done) => {
          const input = [
            { and: [{ name: "aName" }, { value: "aValue" }, { unit: "aUnit" }] },
            { and: [{ name: "aName1" }, { value: "aValue1" }, { unit: "aUnit1" }] }
          ];
          const expected = {
            aName: { name: "aName", value: "aValue", unit: "aUnit" },
            aName1: { name: "aName1", value: "aValue1", unit: "aUnit1" }
          };
          expect(utils.extractParamaterFilterMapping(input)).to.eql(expected);
          done();
        });
      }
    );
  });
});
