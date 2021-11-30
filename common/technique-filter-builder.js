"use strict";

var config = {};
try {
  config = require("../config.json");
} catch (error) {
  console.log("missing config file, applying defaults");
}
const cache = require("./cache");
const techniqueGetter = require("./technique-getter");
const utils = require("./utils");


exports.FreeFormTechniques = class {

  /**
   * Returns the untouched input
   * @param {object} filter PaNOSC loopback filter object
   * @returns {object} Object equal to filter
   */

  buildFilter(filter) {
    return filter;
  }

};

exports.BioPortalLoopbackCacheBuilder = class {

  /**
   * Creates an instance of BioPortalTechniques and LoopbackCache with the
   * provided config
   * @param {object} config Object containing the config values for cache and
   * TechniqueGetter
   */

  constructor(config) {
    this.techniqueGetter = new techniqueGetter.BioPortalTechniques(config);
    this.cache = new cache.LoopbackCache(config.cache);
    this.isNegative = { false: "inq", true: "nin" };
    this.negationMap = {
      neq: "eq", nin: "inq", nlike: "like", nilike: "ilike"
    };
  }

  /**
   * Starting from loopback AND or OR filter it adds synonym to it and returns
   * the relatives combined in an AND or OR filter
   * @param {object} filter PaNOSC loopback filter object
   * @param {string} condition AND or OR string
   * @returns {object} Object the filter + synonym, joined by an OR condition,
   * and returns the loopback filter with concatenated AND or OR conditions
   */

  async andOr(filter, condition) {
    const techniques = filter.map(async f => await this.flat(f));
    return { [condition]: await Promise.all(techniques) };
  }

  /**
   * Starting from loopback filter it adds synonym to it and returns the
   * relatives, combined in a INQ or NIN filter depending if there is a negative
   * condition in the original filter
   * @param {object} filter PaNOSC loopback filter object
   * @returns {object} Object the filter + synonym, joined by an OR condition,
   * and returns the relatives, creating a filter {pid: inq/nin: [...]}
   * depending if there is a negative condition in the original filter
   */

  async flat(filter) {
    const [f, isNegative] = this.transformToPositive(filter);
    const synonymFilter = this.constructor.createSynonym(f);
    const techniques = await this.buildTechniques(
      synonymFilter ? { or: [f, synonymFilter] } : f);
    return {
      pid: {
        [this.isNegative[isNegative]]: utils.unionArraysOfObjects(
          techniques, "relatives").relatives
      }
    };
  }

  /**
   * Returns a loopback filter having changed the negative conditions to
   * positive and a boolean condition, which is true when a change was made,
   * false otherwise
   * @param {object} filter PaNOSC loopback filter object
   * @param {object} start object used to store the final PaNOSC loopback filter
   * @param {Array} negatives array used to store if a negative condition
   * was met
   * @returns {[object, boolean]} PaNOSC loopback filter, having changed the
   * negative conditions and a boolean condition, which is true when a change
   * was made, false otherwise
   */

  transformToPositive(filter, start = {}, negatives = []) {
    return [Object.keys(filter).reduce((o, key) => {
      if (this.negationMap[key]) negatives.push(true);
      const k = this.negationMap[key] || key;
      if (typeof filter[key] === "object" && filter[key] !== null) {
        o[k] = {};
        this.transformToPositive(filter[key], o[k], negatives);
      }
      else o[k] = filter[key];
      return o;
    }, start), negatives[0] || false];
  }

  /**
   * Returns the same filter structure used by the NAME field, replacing the
   * NAME key with SYNONYM
   * @param {object} item PaNOSC loopback filter object
   * @returns {object} filter where the NAME key is replaced by SYNONYM
   */

  static createSynonym(item) {
    const synonym = Object.keys(item).reduce((o, key) => (
      key === "name" ? o["synonym"] = item[key] : o[key] = item[key], o),
    {});
    return synonym.synonym ? synonym : null;
  }

  /**
   * Tranforms an object with the structure of BioPortalTechniques to a format
   * that can be used by LoopbackCache
   * @param {object} obj BioPortal nodes attribute
   * @param {object} [keyMap] Keymap to map BioPortal.nodes to list of object
   * for LoopbackCache
   * @returns {object[]} List of objects that can be saved using LoopbackCache
   */

  static * prepareForCache(tech, keyMap = {
    name: "prefLabel", synonym: "synonym",
    pid: "@id"
  }) {
    var index = 0;
    while (index < tech.collection.length) {
      const out = Object.keys(keyMap).reduce((o, km) => (
        o[km] = tech.collection[index][keyMap[km]], o), {});
      out.relatives = [...tech.nodes.relatives[out.pid]];
      out.createdAt = Date.now();
      yield out;
      index++;
    }
  }

  /**
   * Returns Loopback filter with relatives from filtered LoopbacCache or
   * BioPortal in INQ clause
   * @param {object} filter PaNOSC loopback filter object
   * @returns {object} Loopback filter with relatives from filtered LoopbacCache
   * or BioPortal in INQ clause
   */

  async buildFilter(filter) {
    var outFilter;
    if (filter.and) {
      outFilter = await this.andOr(filter.and, "and");
    } else if (filter.or) {
      outFilter = await this.andOr(filter.or, "or");
    } else {
      outFilter = await this.flat(filter);
    }
    return outFilter;
  }

  /**
   * Builds the items from filtered LoopbacCache or BioPortal
   * @param {object} filter PaNOSC loopback filter object including synonyms
   * @returns {object[]} Array of objects from filtered LoopbacCache or
   * BioPortal
   */

  async buildTechniques(filter) {
    const first = await this.cache.get({ limit: 1 });
    if (first.length > 0) {
      const ttl = this.cache.sttl;
      var outdated = await this.cache.get({
        where: {
          createdAt:
            { lt: Date.now() - ttl * 1000 }
        }
      });
    }
    if ((outdated && outdated.length > 0) || first.length === 0) {
      await this.techniqueGetter.build();
      const items = this.constructor.prepareForCache(this.techniqueGetter);
      await this.cache.set(null, items);
    }
    return await this.cache.get({ where: filter });
  }

};

exports.BioPortalTechniques = {
  LoopbackCache: this.BioPortalLoopbackCacheBuilder
};

exports.technique = new (config.technique ?
  this[config.technique.class][config.technique.cache.class]:
  this["FreeFormTechniques"]
)(config.technique);
