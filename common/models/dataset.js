"use strict";

const ScicatService = require("../scicat-service");
const scicatDatasetService = new ScicatService.Dataset();

const PSSService = require("../pss-service");
const pssScoreService = new PSSService.Score();
const pssScoreEnabled = process.env.PSS_ENABLE || false;

const filterMapper = require("../filter-mapper");
const responseMapper = require("../response-mapper");
const utils = require("../utils");

module.exports = function (Dataset) {
  /**
   * Find all instances of the model matched by filter from the data source.
   * @param {object} filter Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"where":{"something":"value"}}). See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries for more details.
   */

  Dataset.find = async function (filter, query) {
    // remove filter limit
    var limit = -1;
    // retrieve scoring parameters if enabled
    if (pssScoreEnabled) {
      // remove limit only if scoreing is enabled
      if (filter && Object.keys(filter).includes("limit")) {
        limit = filter.limit;
        delete filter.limit;
      }
      // check if query is passed in the filter
      if (!query && filter && Object.keys(filter).includes("query")) {
        query = filter.query;
        delete filter.query;
      }
    }

    const scicatFilter = filterMapper.dataset(filter);
    const datasets = await scicatDatasetService.find(scicatFilter);
    // perform scoring only if it is enabled
    if (pssScoreEnabled) {
      // extract the ids of the dataset returned by SciCat
      const datasetsIds = datasets.map((i) => i.pid);
      const scores = (
        query
          ? await pssScoreService.score(query, datasetsIds, "datasets")
          : {});
      var scoredDatasets = await Promise.all(
        datasets.map(
          async (dataset) => await responseMapper.dataset(dataset, filter, scores),
        )
      );
      if (query) {
        scoredDatasets.sort(utils.compareDatasets);
      }
      return (limit > 0 ? scoredDatasets.slice(0, limit) : scoredDatasets);
    }
    else {
      return await Promise.all(
        datasets.map(
          async (dataset) => await responseMapper.dataset(dataset, filter)
        )
      );
    }
  };

  /**
   * Find a model instance by {{id}} from the data source.
   * @param {string} id Model id
   * @param {object} filter Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"where":{"something":"value"}}). See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries for more details.
   */

  Dataset.findById = async function (id, filter) {
    const scicatFilter = filterMapper.dataset(filter);
    const dataset = await scicatDatasetService.findById(id, scicatFilter);
    return await responseMapper.dataset(dataset, filter);
  };

  /**
   * Count instances of the model matched by where from the data source.
   * @param {object} where Criteria to match model instances
   */

  Dataset.count = async function (where) {
    const scicatFilter = filterMapper.dataset({ where });
    return await scicatDatasetService.count(scicatFilter);
  };

  /**
   * Queries files of Dataset.
   * @param {string} id Dataset id
   * @param {object} filter Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"where":{"something":"value"}}). See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries for more details.
   */

  Dataset.findByIdFiles = async function (id, filter) {
    const scicatFilter = filterMapper.files(filter);
    const origDatablocks = await scicatDatasetService.findByIdFiles(
      id,
      scicatFilter,
    );
    return responseMapper.files(origDatablocks);
  };

  /**
   * Counts files of Dataset.
   * @param {string} id Dataset id
   * @param {object} where Criteria to match model instances
   */

  Dataset.countFiles = async function (id, where) {
    const scicatFilter = filterMapper.files({ where });
    const origDatablocks = await scicatDatasetService.findByIdFiles(
      id,
      scicatFilter,
    );
    const files = responseMapper.files(origDatablocks);
    return { count: files.length };
  };

  Dataset.afterRemote("find", (ctx, result, next) => {
    const filter = ctx.args.filter ? ctx.args.filter : {};
    const inclusions = utils.getInclusionNames(filter);

    if (Object.keys(inclusions).length > 0) {
      Object.keys(inclusions).forEach((primary) => {
        if (inclusions[primary] && inclusions[primary].length > 0) {
          inclusions[primary].forEach((secondary) => {
            ctx.result = utils.filterOnSecondary(
              ctx.result,
              primary,
              secondary,
            );
          });
        } else {
          ctx.result = utils.filterOnPrimary(ctx.result, primary);
        }
      });
    }

    next();
  });
};
