"use strict";

exports.LoopbackCache = class {

  /**
   * Sets the internal default timeout and collection to use to store the cache
   * in the loopback datasource
   * @param {object} config Object which might contain the collection to use to
   * store the cache and the default cache timeout
   */

  constructor(config) {

    this.sttl = config.sttl;
    this.collection = config.collection;
  }

  /**
   * Stores the value list or object in the loopback datasource
   * @param {string|number} key Id to use to refernce the cached element. Not
   * used, added to maintain node-cache signature
   * @param {object|object[]} value List of objects or single object to store in
   *  the loopback datasource
   * @param {number} [ttl] Cache timeout to set on the value being cached
   */

  // eslint-disable-next-line no-unused-vars
  async set(key, value, ttl) {
    var app = require("../server/server");
    const valueArray = Array.isArray(value) || value.next ?
      value : [value];
    const promises = [];
    for (let v of valueArray) {
      promises.push(app.models[this.collection].upsert(
        ttl != null ? { ...v, ttl: ttl } : v));
    }
    await Promise.all(promises);
  }

  /**
   * Gets the cache from the loopback datasource using the provided filter. If
   * the cache has expaired it clears the item
   * @param {object} filter Object containing the loopback filter to use to
   * retrieve the cache
   * @returns {object[]|null|Array} When the cache is cleared or empty, it
   * returns null, otherwise the items after having applied the filter
   */

  async get(filter) {
    var app = require("../server/server");
    const collection = app.models[this.collection];
    const data = await collection.find(filter);
    if (data[0]
      && data[0].createdAt + (
        data[0].ttl != undefined ? data[0].ttl : this.sttl) * 1000 < Date.now()
    ) {
      await collection.destroyAll(filter.where);
      return [];
    } else {
      return data;
    }
  }
};
