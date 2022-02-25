"use strict";

exports.panoscToScicatDataset = {
  pid: "pid",
  title: "datasetName",
  isPublic: "isPublished",
  size: "size",
  creationDate: "creationTime",
};

exports.panoscToScicatDocument = {
  pid: "doi",
  title: "title",
  summary: "abstract",
  doi: "doi",
};

exports.panoscToScicatFile = {
  id: "id",
  name: "dataFileList.path",
  path: "dataFileList.path",
  size: "dataFileList.size",
};

exports.panoscToScicatSample = {
  name: "description",
  pid: "sampleId",
  description: "description",
};

exports.panoscToScicatTechniques = {
  pid: "techniques.pid",
  name: "techniques.name",
};
