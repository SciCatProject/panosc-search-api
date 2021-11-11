"use strict";

const filterMapper = require("./filter-mapper");
const utils = require("./utils");
const ScicatService = require("./scicat-service");
const scicatDatasetService = new ScicatService.Dataset();
const scicatPublishedDataService = new ScicatService.PublishedData();
const scicatSampleService = new ScicatService.Sample();
const pssScoreEnabled = process.env.PSS_ENABLE || false;

/**
 * Map a SciCat dataset to a PaNOSC dataset
 * @param {object} scicatDataset Scicat dataset object
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} PaNOSC dataset object
 */

exports.dataset = async (scicatDataset, filter, scores = {}) => {
  const dataset = {
    pid: scicatDataset.pid,
    title: scicatDataset.datasetName,
    isPublic: scicatDataset.isPublished,
    size: scicatDataset.size,
    creationDate: scicatDataset.creationTime,
    score: 0.0
  };

  const inclusions = utils.getInclusions(filter);

  if (Object.keys(inclusions).includes("document")) {
    const publishedDataFilter = { where: { pidArray: scicatDataset.pid } };
    const scicatPublishedData = await scicatPublishedDataService.find(
      publishedDataFilter
    );
    dataset.document =
      scicatPublishedData.length > 0
        ? await this.document(scicatPublishedData[0], inclusions.document)
        : {};
  }
  if (Object.keys(inclusions).includes("files")) {
    dataset.files = scicatDataset.origdatablocks
      ? this.files(scicatDataset.origdatablocks)
      : [];
  }
  if (Object.keys(inclusions).includes("instrument")) {
    dataset.instrument = scicatDataset.instrument
      ? this.instrument(scicatDataset.instrument)
      : {};
  }
  if (Object.keys(inclusions).includes("parameters")) {
    dataset.parameters = scicatDataset.scientificMetadata
      ? this.parameters(scicatDataset.scientificMetadata, inclusions.parameters)
      : [];
  }
  if (Object.keys(inclusions).includes("samples")) {
    const sampleId = scicatDataset.sampleId;
    if (sampleId) {
      const scicatFilter = filterMapper.sample(inclusions.samples);
      let filter = {};
      if (scicatFilter.where) {
        filter.where = {};
        if (scicatFilter.where.and) {
          filter.where.and = [];
          filter.where.and.push({ sampleId });
          filter.where.and = filter.where.and.concat(scicatFilter.where.and);
        } else if (scicatFilter.where.or) {
          filter.where.and = [];
          filter.where.and.push({ sampleId });
          filter.where.and.push({ or: scicatFilter.where.or });
        } else {
          filter.where = { and: [{ sampleId }].concat(scicatFilter.where) };
        }
      } else {
        filter.where = { sampleId };
      }
      const scicatSamples = await scicatSampleService.find(filter);
      dataset.samples =
        scicatSamples.length > 0
          ? scicatSamples.map((sample) => this.sample(sample))
          : [];
    } else {
      dataset.samples = [];
    }
  }
  if (Object.keys(inclusions).includes("techniques")) {
    dataset.techniques = scicatDataset.techniques
      ? scicatDataset.techniques
      : [];
  }
  if (pssScoreEnabled && Object.keys(scores).includes(dataset.pid)) {
    dataset.score = scores[dataset.pid];
  }
  return dataset;
};

/**
 * Map a SciCat publication to a PaNOSC document
 * @param {object} scicatPublishedData SciCat publishedData object
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} PaNOSC document object
 */

exports.document = async (scicatPublishedData, filter, scores = {}) => {
  const document = {
    pid: scicatPublishedData.doi,
    isPublic: true,
    type: "publication",
    title: scicatPublishedData.title,
    summary: scicatPublishedData.abstract,
    doi: scicatPublishedData.doi,
    score: 0.0
  };

  const inclusions = utils.getInclusions(filter);

  if (Object.keys(inclusions).includes("datasets")) {
    const scicatFilter = filterMapper.dataset(inclusions.datasets);
    const pidArray = scicatPublishedData.pidArray.map((pid) =>
      pid.split("/")[0] === pid.split("/")[1]
        ? pid.split("/").slice(1).join("/")
        : pid
    );
    const datasets = await Promise.all(
      pidArray.map(async (pid) => {
        let filter = {};
        if (scicatFilter.where) {
          filter.where = {};
          if (scicatFilter.where.and) {
            filter.where.and = [];
            filter.where.and.push({ pid });
            filter.where.and = filter.where.and.concat(scicatFilter.where.and);
          } else if (scicatFilter.where.or) {
            filter.where.and = [];
            filter.where.and.push({ pid });
            filter.where.and.push({ or: scicatFilter.where.or });
          } else {
            filter.where = { and: [{ pid }].concat(scicatFilter.where) };
          }
        } else {
          filter.where = { pid };
        }
        if (scicatFilter.include) {
          filter.include = scicatFilter.include;
        }
        const datasets = await scicatDatasetService.find(filter);
        return datasets.length > 0 ? datasets[0] : {};
      })
    );
    document.datasets = await Promise.all(
      datasets.map(
        async (dataset) => await this.dataset(dataset, inclusions.datasets)
      )
    );
  }
  if (Object.keys(inclusions).includes("members")) {
    document.members = this.members(scicatPublishedData, inclusions.members);
  }
  if (Object.keys(inclusions).includes("parameters")) {
    document.parameters = [];
  }
  if (pssScoreEnabled && Object.keys(scores).includes(document.pid)) {
    document.score = scores[document.pid];
  }
  return document;
};

/**
 * Map an array of SciCat origDatablocks to an array of PaNOSC files
 * @param {object[]} scicatOrigDatablocks Array of SciCat origDatablock objects
 * @returns {object[]} Array of PaNOSC file objects
 */

exports.files = (scicatOrigDatablocks) => {
  return [].concat.apply(
    [],
    scicatOrigDatablocks.map((datablock) =>
      datablock.dataFileList.map((file) => {
        const splitPath = file.path.split("/");
        const name = splitPath.pop();
        const path = splitPath.join("/");
        return {
          id: datablock.id,
          name,
          path,
          size: file.size,
        };
      })
    )
  );
};

/**
 * Map a SciCat instrument to a PaNOSC instrument
 * @param {object} scicatInstrument SciCat instrument object
 * @returns {object} PaNOSC instrument object
 */

exports.instrument = (scicatInstrument) => {
  return scicatInstrument.pid && scicatInstrument.name
    ? {
      pid: scicatInstrument.pid,
      name: scicatInstrument.name,
      facility: process.env.FACILITY || "ESS",
    }
    : {};
};

/**
 * Map SciCat publication members to PaNOSC members
 * @param {object} scicatPublishedData SciCat publishedData object
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object[]} Array of PaNOSC members
 */

exports.members = (scicatPublishedData, filter) => {
  const inclusions = filter.include
    ? Object.assign(
      ...filter.include.map((inclusion) =>
        inclusion.scope
          ? { [inclusion.relation]: inclusion.scope }
          : { [inclusion.relation]: {} }
      )
    )
    : {};
  const creators =
    inclusions.person && scicatPublishedData.creator
      ? scicatPublishedData.creator.map((creator) => ({
        person: { fullName: creator },
      }))
      : [];
  const authors =
    inclusions.person && scicatPublishedData.authors
      ? scicatPublishedData.authors.map((author) => ({
        person: { fullName: author },
      }))
      : [];
  return creators.concat(authors);
};

/**
 * Map SciCat scientificMetadata to PaNOSC parameters
 * @param {object} scientificMetadata SciCat scientificMetadata object
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object[]} Array of PaNOSC parameter objects
 */

exports.parameters = (scientificMetadata, filter) => {
  const parameters =
    Object.keys(filter).includes("where")
      ? utils.extractParamaterFilterMapping(
        filter.where.or
          ? filter.where.or
          : [filter.where]
      )
      : {};
  return Object.keys(scientificMetadata).map((key) => {
    if (parameters[key] && parameters[key].unit) {
      const { value, unit } = utils.convertToUnit(
        scientificMetadata[key].valueSI,
        scientificMetadata[key].unitSI,
        parameters[key].unit
      );
      return {
        name: key,
        value,
        unit,
      };
    } else {
      return {
        name: key,
        value: scientificMetadata[key].value || scientificMetadata[key].v,
        unit: scientificMetadata[key].unit || scientificMetadata[key].u,
      };
    }
  });
};

/**
 * Map SciCat sample to PaNOSC sample
 * @param {object} scicatSample SciCat sample object
 * @returns {object} PaNOSC sample object
 */

exports.sample = (scicatSample) => {
  return {
    name: scicatSample.description,
  };
};
