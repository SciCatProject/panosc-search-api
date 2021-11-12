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
  }

  /**
   * Starting from loopback AND filter it adds synonym to it and returns the
   * intersection of relatives
   * @param {object} filter PaNOSC loopback filter object
   * @returns {object} Object the filter + synonym, joined by an OR condition,
   * and returns the loopback filter with concatenated AND conditions
   */

  async and(filter) {
    const techniques = filter.map(async f => {
      let synonym = this.constructor.createSynonym(f);
      if (synonym) {
        synonym = { or: [f, synonym] };
      }
      const technique = await this.buildTechniques(synonym || f);
      const union = utils.unionArraysOfObjects(technique, "relatives");
      return { pid: { inq: union.relatives } };
    });
    return { and: await Promise.all(techniques) };
  }

  /**
   * Starting from loopback filter it adds synonym to it and returns the
   * relatives
   * @param {object} filter PaNOSC loopback filter object
   * @returns {object} Object the filter + synonym, joined by an OR condition,
   * and returns the relatives
   */

  async flat(filter) {
    const synonymFilter = this.constructor.createSynonym(filter);
    const techniques = await this.buildTechniques(
      synonymFilter ? { or: [filter, synonymFilter] } : filter);
    return utils.unionArraysOfObjects(techniques, "relatives").relatives;
  }

  /**
   * Starting from loopback OR filter it adds synonym to it and returns the
   * union of relatives
   * @param {object} filter PaNOSC loopback filter object
   * @returns {object} Object the filter + synonym, joined by an OR condition,
   * and returns the union of relatives
   */

  async or(filter) {
    const fullFilter = filter.reduce((start, f) => {
      const synonym = this.constructor.createSynonym(f);
      if (synonym) {
        return start.concat([f, synonym]);
      }
      return start.concat(f);
    }, []);
    const techniques = await this.buildTechniques({ or: fullFilter });
    return utils.unionArraysOfObjects(techniques, "relatives").relatives;
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
    var techniques;
    if (filter.and) {
      return await this.and(filter.and);
    } else if (filter.or) {
      techniques = await this.or(filter.or);
    } else {
      techniques = await this.flat(filter);
    }
    return { pid: { inq: techniques } };
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
