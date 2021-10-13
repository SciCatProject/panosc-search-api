"use strict";

const superagent = require("superagent");
const utils = require("./utils");

exports.BioPortalTechniques = class {

  /**
   * Sets url and apikey to use to get data from BioPortal
   * @param {object} config Object with the url and the apiKey to use to
   * access BioPortal
   */

  constructor(config) {
    this.url = config.url;
    this.apiKey = config.apiKey;
  }

  /**
   * Sets the url, the queryParams and the headers to use
   */

  composeURL() {
    this.headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `apikey token=${this.apiKey}`,
    };
    this.queryParams = { "include": "children,prefLabel,synonym,parents" };
    this.url = new URL(this.url);
  }

  /**
   * Concats together the responses of BioPortal from different pages
   * @returns {Array} List of responses from BioPortal
   */

  async getCollection() {
    const [url, headers, queryParams] = [
      this.url, this.headers, this.queryParams];
    const page = queryParams.page || 1;
    const res = await superagent.get(url).query(
      Object.assign(queryParams, { page: page })).set(headers);
    const body = JSON.parse(res.text);
    var collection = body.collection;
    const promises = utils.range(page + 1, body.pageCount).map(
      p =>
        superagent.get(url).query(
          Object.assign(queryParams, { page: p })
        ).set(headers).then(
          res => JSON.parse(res.text).collection
        )
    );
    return collection.concat(...await Promise.all(promises));
  }

  /**
   * From the list of responses from BioPortal,
   * it creates an object where firstKey is the type of object
   * and as value a second object with an id and where the value is BioPortal
   * response.firstKey
   * @param {object[]} collection List of objects each being an item from the
   * response from BioPortal
   * @returns {Object} Object where firstKey is the type of object
   * and as value a second object with an id and where the value is BioPortal
   * response.firstKey
   */

  static buildNodes(collection) {
    const o = {
      "names": {}, "@id": {}, "children": {}, "synonym": {},
      "synonymT": {}, "leaves": [], "parents": {}, "roots": []
    };
    for (var node of collection) {
      const _id = node["@id"];
      o["names"][_id] = node["prefLabel"];
      o["@id"][node["prefLabel"]] = _id;
      o["children"][_id] = node["children"];
      o["synonym"][_id] = node["synonym"];
      if (node["synonym"]) node["synonym"].map(
        synonym => o["synonymT"][synonym] = _id);
      if (node["children"].length == 0) o["leaves"].push(_id);
      o["parents"][_id] = node["parents"];
      if (o["parents"][_id].length == 0) o["roots"].push(_id);
    }
    return o;
  }

  /**
   * Removes the extra white spaces from the input item
   * @param {string} item String potentially with extra white spaces
   * @returns {string} String with extra white spaces removed
   */

  static prefLabel(item) {
    return item.replace(/\s+/g, " ").trim();
  }

  /**
   * Removes the extra white spaces from each string in the array
   * @param {string[]} item Array of strings potentially with extra white spaces
   * @returns {string[]} Array of strings with extra white spaces removed
   */

  static synonym(item) {
    return item.map(this.prefLabel);
  }

  /**
   * Takes the element '@id' from each object in the item array
   * @param {object[]} item Array of objects each with '@id' key
   * @returns {string[]} Array of strings being the value of '@id' in each
   * object in the input array
   */

  static children(item) {
    return item.map(child => child["@id"]);
  }

  /**
   * Takes the element '@id' from each object in the item array unless all
   * objects in the array have prefLabel null, thus return []
   * @param {object[]} item Array of objects each with '@id' and prefLabel keys
   * @returns {string[]} Array of strings being the value of '@id' in each
   * object in the input array or []
   */

  static parents(item) {
    if (item.filter(e => e["prefLabel"]).length == 0) {
      return [];
    }
    else {
      return item.map(parent => parent["@id"]);
    }
  }

  /**
   * From the list of responses from BioPortal it applies a first processing,
   * applying the methods defined in the class which have the name of the keys.
   * @param {object[]} collection List of objects each being an item from the
   * response from BioPortal
   * @returns {Generator} Generator having applied the methods defined in the
   * class which have the name of the keys
   */

  * processCollection(collection) {
    this.collection = [];
    let index = 0;
    while (index < collection.length) {
      const col = collection[index];
      const processed = Object.keys(col).reduce((obj, key) => {
        obj[key] = this.constructor[key] ?
          this.constructor[key](col[key]) : col[key];
        return obj;
      }, {});
      yield processed;
      this.collection.push(processed);
      index++;
    }
  }

  /**
   * Builds and sets a graph with key the id of the BioPortal item and value
   * the relatives (ancestor or descendants)
   * @returns {BioPortalTechniques} Returns the instance with the attributes set
   */

  async build() {
    this.composeURL();
    const collection = this.processCollection(
      await this.getCollection());
    const nodes = this.constructor.buildNodes(collection);
    nodes.relatives = utils.buildForest(nodes.leaves, nodes.parents);
    this.nodes = nodes;
    return this;
  }

};
