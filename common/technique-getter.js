"use strict";

const superagent = require("superagent");

const utils = require("./utils");


class OntologyTechnique {

  /**
   * Sets the list of keys to parse the response
   */

  constructor() {
    this.keys = ["pid", "parents"];
  }

  /**
   * From the list of responses it applies a first processing, applying the
   * methods defined in the class which have the name of the keys.
   * @param {object[]} collection List of objects each being an item from the
   * response
   * @returns {Generator} Generator having applied the methods defined in the
   * class which have the name of the keys
   */

  * processCollection(collection) {
    this.collection = [];
    let index = 0;
    while (index < collection.length) {
      const col = collection[index];
      const processed = this.keys.reduce((obj, key) => {
        obj[key] = this[key](col);
        return obj;
      }, {});
      yield processed;
      this.collection.push(processed);
      index++;
    }
  }

  /**
   * From the list of responses, it creates an object where firstKey is the
   * type of object and as value a second object with an id and where the value
   * is the response.firstKey
   * @param {object[]} collection List of objects each being an item from the
   * response
   * @returns {Object} Object where firstKey is the type of object and as value
   * a second object with an id and where the value is response.firstKey
   */

  buildNodes(collection) {
    const o = { "leaves": [], "parents": {} };
    for (var node of collection) {
      const _id = node["pid"];
      this.leavesNode(node, o);
      o["parents"][_id] = node["parents"];
    }
    return o;
  }

  /**
   * Defines a function to use to compute the leaves nodes
   */

  leavesNode() { }

  /**
   * Builds and sets a graph with key the id of the item and value the
   * relatives (ancestor or descendants)
   * @returns {OntologyTechnique} Returns the instance with the attributes set
   */

  async build() {
    this.composeURL();
    const collection = this.processCollection(
      await this.getCollection());
    const nodes = this.buildNodes(collection);
    const relatives = utils.buildForest(nodes.leaves, nodes.parents);
    this.relatives = relatives;
    return this;
  }

  /**
   * Enforces pid implementation
   */

  pid() {
    throw new Error("Method 'pid()' must be implemented.");
  }

  /**
   * Enforces prefLabel implementation
   */

  parents() {
    throw new Error("Method 'parents()' must be implemented.");
  }

}

class BioPortalTechniques extends OntologyTechnique {

  /**
   * Sets url and apikey to use to get data from BioPortal
   * @param {object} config Object with the url and the apiKey to use to
   * access BioPortal
   */

  constructor(config) {
    super();
    config = config || {};
    this.url = config.url;
    this.apiKey = config.apiKey;
    this.keys.push(...["prefLabel", "synonym", "children"]);
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
   * Removes the extra white spaces from the input item
   * @param {object} item Object with values with extra white spaces
   * @returns {string} String with extra white spaces removed
   */

  pid(item) {
    return item["@id"];
  }

  /**
   * Removes the extra white spaces from the input item
   * @param {object} item Object with values with extra white spaces
   * @returns {string} String with extra white spaces removed
   */

  prefLabel(item) {
    return utils.removeExtraSpaces(item.prefLabel);
  }

  /**
   * Removes the extra white spaces from each string in the array
   * @param {object} item Object of values potentially with extra white spaces
   * @returns {string[]} Array of strings with extra white spaces removed
   */

  synonym(item) {
    return item.synonym.map(e => utils.removeExtraSpaces(e));
  }

  /**
   * Takes the element '@id' from each object in the item array
   * @param {object} item Object of values each with '@id' key
   * @returns {string[]} Array of strings being the value of '@id' in each
   * object in the input array
   */

  children(item) {
    return item.children.map(child => child["@id"]);
  }

  /**
   * Takes the element '@id' from each object in the item array unless all
   * objects in the array have prefLabel null, thus return []
   * @param {object} item Object of values each with '@id' and prefLabel keys
   * @returns {string[]} Array of strings being the value of '@id' in each
   * object in the input array or []
   */

  parents(item) {
    if (item.parents.filter(e => e["prefLabel"]).length == 0) {
      return [];
    }
    else {
      return item.parents.map(parent => parent["@id"]);
    }
  }

  /**
   * If the node has no children it add it to the leaves list
   * @param {object} node Object with at least children and pid keys
   * @param {object} o Object containing the leaves value where to add leaves
   */

  leavesNode(node, o) {
    if (node["children"].length == 0) o["leaves"].push(node.pid);
  }

}

exports.BioPortalTechniques = BioPortalTechniques;
