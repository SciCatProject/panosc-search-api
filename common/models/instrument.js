'use strict';

const ScicatService = require('../scicat.service');
const scicatInstrumentService = new ScicatService.Instrument();

module.exports = function (Instrument) {
  /**
   * Find all instances of the model matched by filter from the data source.
   * @param {object} filter Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"where":{"something":"value"}}). See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries for more details.
   */

  Instrument.find = async function (filter) {
    return scicatInstrumentService.find(filter);
  };

  /**
   * Find a model instance by {{id}} from the data source.
   * @param {string} id Model id
   * @param {object} filter Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"where":{"something":"value"}}). See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries for more details.
   */

  Instrument.findById = async function (id, filter) {
    return scicatInstrumentService.findById(id, filter);
  };

  /**
   * Count instances of the model matched by where from the data source.
   * @param {object} where Criteria to match model instances
   */

  Instrument.count = async function (where) {
    return scicatInstrumentService.count(where);
  };
};
