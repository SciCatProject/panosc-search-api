"use strict";

const expect = require("chai").expect;
const responseMapper = require("../common/response-mapper");

describe("response-mapper", () => {
  describe("parameters", () => {

    const tests = [
      {
        args: {
          data: {
            name1: { valueSI: 1, unitSI: "m" },
            name2: { value: 5000, unit: "g" },
          },
          filter: {
            and: [
              { name: "name1" },
              { value: 1000 },
              { unit: "mm" }
            ]
          }
        },
        expected: [
          { name: "name1", value: 1000, unit: "mm" },
          { name: "name2", value: 5000, unit: "g" }
        ],
        message: "list with parameters converted to units in the filter"
      },
      {
        args: {
          data: {
            name1: { value: "Cu", unit: "" }
          },
          filter: {
            and: [
              { name: "name1" },
              { value: "Cu" }
            ]
          }
        },
        expected: [
          { name: "name1", value: "Cu", unit: "" }
        ],
        message: "list with a parameter without running unit conversion"
      },
      {
        args: {
          data: {
            name1: { valueSI: 1, unitSI: "m" },
            name2: { valueSI: 5, unitSI: "kg" },
          },
          filter: {
            or: [
              {
                and: [
                  { name: "name1" },
                  { value: 1000 },
                  { unit: "mm" }]
              },
              {
                and: [
                  { name: "name2" },
                  { value: 5000 },
                  { unit: "g" }
                ]
              }
            ]
          }
        },
        expected: [
          { name: "name1", value: 1000, unit: "mm" },
          { name: "name2", value: 5000, unit: "g" }
        ],
        message: "list with both values converted to filter units, from the or condition"
      },
      {
        args: {
          data: {
            name1: { valueSI: 1, unitSI: "m" },
          },
          filter: {
            or: [
              {
                and: [
                  { name: "name1" },
                  { value: 1000 },
                  { unit: "mm" }
                ]
              },
              {
                and: [
                  { name: "name2" },
                  { value: 5000 },
                  { unit: "g" }
                ]
              }
            ]
          }
        },
        expected: [
          { name: "name1", value: 1000, unit: "mm" }
        ],
        message: "list disregarding one of the two conversions from the filter"
      },
    ];
    tests.forEach(({ args, expected, message }) => {
      context(`${message}`, () => {
        it(`should return a ${message}`, (done) => {
          const inclusions = responseMapper.parameters(args.data, { where: args.filter });
          expect(inclusions).to.eql(expected);
          done();
        });
      });
    });
  });

});
