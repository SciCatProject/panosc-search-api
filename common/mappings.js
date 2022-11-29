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

exports.psiParameter = {
  // eslint-disable-next-line camelcase
  incident_photon_energy: {
    value: ".beamlineParameters.Beam energy.v",
    unit: ".beamlineParameters.Beam energy.u",
  },
  // eslint-disable-next-line camelcase
  sample_temperature: {
    value: ".sampleTemperature.value",
    unit: ".sampleTemperature.unit",
  },
  // eslint-disable-next-line camelcase
  incident_wavelength: {
    value: ".beamlineParameters.Beam energy.v",
    unit: ".beamlineParameters.Beam energy.u",
  },
};
