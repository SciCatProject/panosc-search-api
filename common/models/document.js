"use strict";

const ScicatService = require("../scicat-service");
const scicatPublishedDataService = new ScicatService.PublishedData();

const PSSService = require("../pss-service");
const pssScoreService = new PSSService.Score();
const pssScoreEnabled = process.env.PSS_ENABLE || false;

const filterMapper = require("../filter-mapper");
const responseMapper = require("../response-mapper");
const utils = require("../utils");

module.exports = function (Document) {

  /**
   * Find all instances of the model matched by filter from the data source.
   * @param {object} filter Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"where":{"something":"value"}}). See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries for more details.
   */

  Document.find = async function (filter, query) {
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

    // checks if we have hard filter on dataset's technology
    filter = await filterMapper.expandTechniquesInFilter(filter);

    const scicatFilter = filterMapper.document(filter);
    const publishedData = await scicatPublishedDataService.find(scicatFilter);
    // perform scoring only if is enabled
    if (pssScoreEnabled) {
      // extract the ids of the dataset returned by SciCat
      const documentsIds = publishedData.map((i) => i.doi);
      const scores = (
        query
          ? await pssScoreService.score(query, documentsIds, "documents")
          : {});

      var scoredDocuments = await Promise.all(
        publishedData.map(
          async (data) => await responseMapper.document(data, filter, scores),
        ),
      );
      if (query) {
        scoredDocuments.sort(utils.compareDocuments);
      }
      // limit is applied in Document.afterRemote("find"...
      // check below
      //return (limit > 0 ? scoredDocuments.slice(0, limit) : scoredDocuments);

      // reinsert the limit to  be used in the afterRemote function
      if (limit > 0) {
        filter.limit = limit;
      }

      return scoredDocuments;
    }
    else {
      // no scoring, returns results as they are
      return await Promise.all(
        publishedData.map(
          async (data) => await responseMapper.document(data, filter)
        )
      );
    }
  };

  /**
   * Find a model instance by {{id}} from the data source.
   * @param {string} id Model id
   * @param {object} filter Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"where":{"something":"value"}}). See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries for more details.
   */

  Document.findById = async function (id, filter) {
    const scicatFilter = filterMapper.document(filter);
    const publishedData = await scicatPublishedDataService.findById(
      id,
      scicatFilter,
    );
    return await responseMapper.document(publishedData, filter);
  };

  /**
   * Count instances of the model matched by where from the data source.
   * @param {object} where Criteria to match model instances
   */

  Document.count = async function (where) {
    const scicatFilter = filterMapper.document({ where });
    return await scicatPublishedDataService.count(scicatFilter.where);
  };

  Document.afterRemote("find", (ctx, result, next) => {
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

    // apply limit
    if (filter.limit) {
      ctx.result = ctx.result.splice(0, filter.limit);
    }

    next();
  });
};
