"use strict";

const expect = require("chai").expect;
const sandbox = require("sinon").createSandbox();

const loopbackCache = require("../common/cache").LoopbackCache;

let app;
before((done) => {
  app = require("../server/server");
  done();
});

afterEach((done) => {
  sandbox.restore();
  done();
});

describe("LoopbackCache", () => {
  const cache = new loopbackCache(
    { sttl: 10, collection: "Technique" }
  );
  describe("set", () => {
    const tests = [
      {
        args: { input: [{ name: "a", pid: 1 }], ttl: 100 },
        expected: { name: "a", pid: 1, ttl: 100 },
        message: "array"
      },
      {
        args: { input: [{ name: "a", pid: 1 }], ttl: 100 },
        expected: { name: "a", pid: 1, ttl: 100 },
        message: "object"
      },
      {
        args: {
          input: function* gen(input) { yield input; }(
            { name: "b", pid: 2, createdAt: 100 }
          ),
          ttl: 0
        },
        expected: { name: "b", pid: 2, ttl: 0, createdAt: 100 },
        message: "generator"
      }
    ];
    tests.forEach(({ args, expected, message }) => {
      context(
        `Stores the ${message} in the loopback datasource`,
        () => {
          it(`${message}`,
            (done) => {
              const mock = sandbox.stub(app.models[cache.collection],
                "upsert");
              cache.set(null, args.input, args.ttl).then(() => {
                expect(mock.calledWith(expected)).to.be.true;
              });
              done();
            });
        }
      );
    });
  });

  describe("get", () => {
    const tests = [
      {
        args: { where: { name: "a" } },
        expected: [{ name: "a", pid: "1", ttl: 100, createdAt: 10 }],
        message: "non empty"
      },
      {
        args: { where: { name: "c" } },
        expected: [],
        message: "empty"
      },
      {
        args: { where: { name: "b" } },
        expected: "destroyAll",
        message: "expired"
      }
    ];
    tests.forEach(({ args, expected, message }) => {
      context(
        `${message} cache due to filter`,
        () => {
          it(`${message}`,
            (done) => {
              const mockFind = sandbox.stub(app.models[cache.collection],
                "find");
              sandbox.stub(Date, "now").returns(10);
              if (expected === "destroyAll") {
                mockFind.returns([{ name: "b", pid: 2, createdAt: 0, ttl: 0 }]);
                const mock = sandbox.spy(app.models[cache.collection],
                  expected);
                cache.get(args).then(() => expect(
                  mock.calledWith(args.where)).to.be.true);
              } else if (expected.length > 0) {
                mockFind.returns(expected);
                cache.get(args).then(data =>
                  expect(data[0]).to.be.eql(expected[0]));
              } else {
                mockFind.returns(expected);
                cache.get(args).then(data =>
                  expect(data).to.be.eql(expected));
              }
              done();
            });
        }
      );
    });
  });

});
