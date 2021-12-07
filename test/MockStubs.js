/* eslint-disable camelcase */
"use strict";

const jsdom = require("jsdom");

const dataset1 = {
  pid: "20.500.12269/panosc-dataset1",
  owner: "John Smith",
  ownerEmail: "john.smith@email.com",
  orcidOfOwner: "https://orcid.org/0000-0000-0000-0000",
  contactEmail: "johm.smith@email.com",
  sourceFolder: "/nfs/groups/beamlines/loki/123456",
  sourceFolderHost: "string",
  size: 30000,
  packedSize: 30000,
  numberOfFiles: 3,
  numberOfFilesArchived: 0,
  creationTime: "2020-07-06T08:20:56.000Z",
  type: "raw",
  validationStatus: "valid",
  keywords: ["loki", "neutron", "panosc"],
  description: "Dataset created for testing the PaNOSC Search API.",
  datasetName: "PaNOSC Test Dataset 1",
  classification: "AV=medium,CO=low",
  license: "CC-BY-4.0",
  version: "3.0.1",
  isPublished: true,
  ownerGroup: "ess",
  accessGroups: ["loki", "odin"],
  createdBy: "admin",
  updatedBy: "ldap.John Smith",
  createdAt: "2020-07-06T08:58:38.780Z",
  updatedAt: "2020-07-13T09:18:06.854Z",
  instrumentId: "20.500.12269/bf5785ca-7935-4f5a-b793-23dae989d2b2",
  techniques: [
    {
      pid: "20.500.12269/panosc-tech1",
      name: "small-angle neutron scattering",
    },
  ],
  principalInvestigator: "john.smith@email.com",
  endTime: "2020-07-06T09:20:56.371Z",
  creationLocation: "loki",
  dataFormat: "NeXus HDF5",
  scientificMetadata: {
    chemical_formula: {
      type: "string",
      value: "Cu",
      unit: "",
    },
    sample_state: {
      type: "string",
      value: "solid",
      unit: "",
    },
  },
  sampleId: "20.500.12269/panosc-sample1",
};

const dataset2 = {
  pid: "20.500.12269/panosc-dataset2",
  owner: "John Smith",
  ownerEmail: "john.smith@email.com",
  orcidOfOwner: "https://orcid.org/0000-0000-0000-0000",
  contactEmail: "johm.smith@email.com",
  sourceFolder: "/nfs/groups/beamlines/odin/123456",
  sourceFolderHost: "string",
  size: 30000,
  packedSize: 30000,
  numberOfFiles: 3,
  numberOfFilesArchived: 0,
  creationTime: "2020-07-06T08:20:56.000Z",
  type: "raw",
  validationStatus: "valid",
  keywords: ["loki", "neutron", "panosc"],
  description: "Dataset created for testing the PaNOSC Search API.",
  datasetName: "PaNOSC Test Dataset 2",
  classification: "AV=medium,CO=low",
  license: "CC-BY-4.0",
  version: "3.0.1",
  isPublished: true,
  ownerGroup: "ess",
  accessGroups: ["loki", "odin"],
  createdBy: "admin",
  updatedBy: "ldap.John Smith",
  createdAt: "2020-07-06T08:58:38.780Z",
  updatedAt: "2020-07-13T09:18:06.854Z",
  instrumentId: "20.500.12269/27d2e842-a9d4-4897-aebb-30ba1743b956",
  techniques: [
    {
      pid: "20.500.12269/panosc-tech1",
      name: "small-angle neutron scattering",
    },
  ],
  principalInvestigator: "john.smith@email.com",
  endTime: "2020-07-06T09:20:56.371Z",
  creationLocation: "odin",
  dataFormat: "NeXus HDF5",
  scientificMetadata: {
    photon_energy: {
      type: "measurement",
      value: 930,
      unit: "eV",
      valueSI: 1.49002420545e-16,
      unitSI: "(kg m^2) / s^2",
    },
  },
  sampleId: "20.500.12269/panosc-sample1",
};

const dataset3 = {
  pid: "20.500.12269/panosc-dataset3",
  owner: "James Chadwick",
  ownerEmail: "james.chadwick@email.com",
  orcidOfOwner: "https://orcid.org/0000-0000-0000-0000",
  contactEmail: "james.chadwick@email.com",
  sourceFolder: "/nfs/groups/beamlines/freia/123456",
  sourceFolderHost: "string",
  size: 30000,
  packedSize: 30000,
  numberOfFiles: 3,
  numberOfFilesArchived: 0,
  creationTime: "2020-07-06T08:20:56.000Z",
  type: "raw",
  validationStatus: "valid",
  keywords: ["loki", "neutron", "panosc"],
  description: "Dataset created for testing the PaNOSC Search API.",
  datasetName: "PaNOSC Test Dataset 3",
  classification: "AV=medium,CO=low",
  license: "CC-BY-4.0",
  version: "3.0.1",
  isPublished: true,
  ownerGroup: "ess",
  accessGroups: ["loki", "odin"],
  createdBy: "admin",
  updatedBy: "ldap.James Chadwick",
  createdAt: "2020-07-06T08:58:38.780Z",
  updatedAt: "2020-07-13T09:18:06.854Z",
  instrumentId: "20.500.12269/7ce169f6-aff3-48a7-87ce-ff1da6be960a",
  techniques: [
    {
      pid: "20.500.12269/panosc-tech2",
      name: "x-ray absorption",
    },
  ],
  principalInvestigator: "james.chadwick@email.com",
  endTime: "2020-07-06T09:20:56.371Z",
  creationLocation: "freia",
  dataFormat: "NeXus HDF5",
  scientificMetadata: {
    temperature: {
      type: "measurement",
      value: 20,
      unit: "celsius",
      valueSI: 293.15,
      unitSI: "K",
    },
  },
  sampleId: "20.500.12269/panosc-sample1",
};

const dataset4 = {
  pid: "20.500.12269/panosc-dataset4",
  owner: "James Chadwick",
  ownerEmail: "james.chadwick@email.com",
  orcidOfOwner: "https://orcid.org/0000-0000-0000-0000",
  contactEmail: "james.chadwick@email.com",
  sourceFolder: "/nfs/groups/beamlines/heimdal/123456",
  sourceFolderHost: "string",
  size: 30000,
  packedSize: 30000,
  numberOfFiles: 3,
  numberOfFilesArchived: 0,
  creationTime: "2020-07-06T08:20:56.000Z",
  type: "raw",
  validationStatus: "valid",
  keywords: ["loki", "neutron", "panosc"],
  description: "Dataset created for testing the PaNOSC Search API.",
  datasetName: "PaNOSC Test Dataset 4",
  classification: "AV=medium,CO=low",
  license: "CC-BY-4.0",
  version: "3.0.1",
  isPublished: true,
  ownerGroup: "ess",
  accessGroups: ["loki", "odin"],
  createdBy: "admin",
  updatedBy: "ldap.James Chadwick",
  createdAt: "2020-07-06T08:58:38.780Z",
  updatedAt: "2020-07-13T09:18:06.854Z",
  instrumentId: "20.500.12269/5e3a1793-218c-4a04-a4c7-8f4c5ac1c4dd",
  techniques: [
    {
      pid: "20.500.12269/panosc-tech2",
      name: "x-ray absorption",
    },
  ],
  principalInvestigator: "james.chadwick@email.com",
  endTime: "2020-07-06T09:20:56.371Z",
  creationLocation: "heimdal",
  dataFormat: "NeXus HDF5",
  scientificMetadata: {
    wavelength: {
      type: "measurement",
      value: 1064,
      unit: "nm",
      valueSI: 0.000001064,
      unitSI: "m",
    },
  },
  sampleId: "20.500.12269/panosc-sample1",
};

const pubData1 = {
  doi: "10.5072/panosc-test-publication1",
  affiliation: "ESS",
  creator: ["John Smith"],
  publisher: "ESS",
  publicationYear: 2020,
  title: "PaNOSC Test Publication",
  url: "https://doi.org/10.5072/panosc-test-publication1",
  abstract: "Publication used for testing of the PaNOSC Search API.",
  dataDescription: "https://github.com/ess-dmsc/ess_file_formats/wiki/HDF5",
  resourceType: "NeXus HDF5",
  numberOfFiles: 3,
  sizeOfArchive: 30000,
  pidArray: [
    "20.500.12269/panosc-test-dataset1",
    "20.500.12269/panosc-test-dataset2",
  ],
  authors: ["John Smith"],
  registeredTime: "2020-07-06T08:20:57.218Z",
  status: "registered",
  scicatUser: "johnsmith",
  thumbnail: "",
  relatedPublications: [],
  downloadLink: "",
  createdBy: "ldap.John Smith",
  updatedBy: "ldap.John Smith",
  createdAt: "2020-07-06T08:20:57.219Z",
  updatedAt: "2020-07-09T06:47:33.537Z",
};

const pubData2 = {
  doi: "10.5072/panosc-test-publication2",
  affiliation: "ESS",
  creator: ["James Chadwick"],
  publisher: "ESS",
  publicationYear: 2020,
  title: "PaNOSC Test Publication",
  url: "https://doi.org/10.5072/panosc-test-publication2",
  abstract: "Publication used for testing of the PaNOSC Search API.",
  dataDescription: "https://github.com/ess-dmsc/ess_file_formats/wiki/HDF5",
  resourceType: "NeXus HDF5",
  numberOfFiles: 3,
  sizeOfArchive: 30000,
  pidArray: [
    "20.500.12269/panosc-test-dataset3",
    "20.500.12269/panosc-test-dataset4",
  ],
  authors: ["James Chadwick"],
  registeredTime: "2020-07-06T08:20:57.218Z",
  status: "registered",
  scicatUser: "jameschadwick",
  thumbnail: "",
  relatedPublications: [],
  downloadLink: "",
  createdBy: "ldap.James Chadwick",
  updatedBy: "ldap.James Chadwick",
  createdAt: "2020-07-06T08:20:57.219Z",
  updatedAt: "2020-07-09T06:47:33.537Z",
};

const xmlContent = `<?xml version="1.0"?>
<rdf:RDF xmlns="aXML">

    <owl:Class rdf:about="class1">
        <obo:IAO_0000115 rdf:datatype="aDescription">a description</obo:IAO_0000115>
        <rdfs:label rdf:datatype="aLabel">label1</rdfs:label>
    </owl:Class>

    <owl:Class rdf:about="http://class2/label2">
        <owl:equivalentClass rdf:resource="class5"/>
        <rdfs:subClassOf rdf:resource="class1"/>
        <skos:altLabel rdf:datatype="aSynonym">synonym1</skos:altLabel>
        <skos:altLabel rdf:datatype="aSynonym">synonym2</skos:altLabel>
    </owl:Class>

    <owl:Class rdf:about="class3">
        <rdfs:subClassOf rdf:resource="class1"/>
        <rdfs:subClassOf rdf:resource="http://class2/label2"/>
        <rdfs:label rdf:datatype="aLabel">label3</rdfs:label>
        <owl:equivalentClass>
            <owl:Class>
                <owl:intersectionOf rdf:parseType="Collection">
                    <rdf:Description rdf:about="aDescription5"/>
                    <rdf:Description rdf:about="aDescription6"/>
                </owl:intersectionOf>
            </owl:Class>
        </owl:equivalentClass>
    </owl:Class>

</rdf:RDF>`;

const querySelectorXml = new jsdom.JSDOM(
  xmlContent).window.document.querySelectorAll(
  "owl\\:Class[rdf\\:about]");

module.exports = {
  dataset: {
    find: {
      noFilter: [dataset1, dataset2, dataset3, dataset4],
      personFilter: [[dataset3], [dataset4]],
      photonEnergyFilter: [dataset2],
      solidCopperFilter: [dataset1],
      techniquesFilter: [dataset3, dataset4],
      temperatureFilter: [dataset3],
      wavelengthFilter: [[], [], [], [dataset4]],
      techniqueSampleFilter: [[], [], [dataset3], [dataset4]],
    },
    findById: dataset1,
  },
  instrument: {
    find: {
      noFilter: [
        {
          pid: "20.500.12269/0e8a9924-60d4-47aa-a00c-0c9681e600dd",
          name: "C-SPEC",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/12ef7aeb-a1dc-473d-81c6-4cab5f33b6c0",
          name: "ESTIA",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/27d2e842-a9d4-4897-aebb-30ba1743b956",
          name: "ODIN",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/4e61f2dc-972f-4986-899c-e4912a6862aa",
          name: "DREAM",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/594d0782-df20-41cc-8312-94e703391cea",
          name: "BIFROST",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/5e3a1793-218c-4a04-a4c7-8f4c5ac1c4dd",
          name: "HEIMDAL",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/71aa0828-acc3-4d34-9479-45f40e00a65d",
          name: "MIRACLES",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/77eb4dd7-6b57-4039-b2dc-2f282d792270",
          name: "VESPA",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/7c2187a0-d51b-4866-94f6-1695a266d737",
          name: "MAGiC",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/7ce169f6-aff3-48a7-87ce-ff1da6be960a",
          name: "FREIA",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/a1060de0-3baf-4e2a-a06b-1f67cf643e77",
          name: "NMX",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/b9ba2791-a363-496c-b62c-e1c85b0cd2b4",
          name: "BEER",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/bf5785ca-7935-4f5a-b793-23dae989d2b2",
          name: "LoKI",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/d79158a9-9307-43b5-9924-4929da3710ae",
          name: "T-REX",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/f38159a8-a6f9-4250-b377-be055457d98c",
          name: "SKADI",
          customMetadata: {},
        },
      ],
      nameFilter: [
        {
          pid: "20.500.12269/bf5785ca-7935-4f5a-b793-23dae989d2b2",
          name: "LoKI",
          customMetadata: {},
        },
      ],
      facilityFilter: [
        {
          pid: "20.500.12269/0e8a9924-60d4-47aa-a00c-0c9681e600dd",
          name: "C-SPEC",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/12ef7aeb-a1dc-473d-81c6-4cab5f33b6c0",
          name: "ESTIA",
          customMetadata: {},
        },
        {
          pid: "20.500.12269/27d2e842-a9d4-4897-aebb-30ba1743b956",
          name: "ODIN",
          customMetadata: {},
        },
      ],
    },
    findById: {
      pid: "20.500.12269/27d2e842-a9d4-4897-aebb-30ba1743b956",
      name: "ODIN",
      customMetadata: {},
    },
  },
  publishedData: {
    find: {
      noFilter: [pubData1, pubData2],
      personFilter: [pubData2],
    },
    findById: pubData1,
  },
  sample: {
    find: [
      {
        sampleId: "20.500.12269/panosc-sample1",
        owner: "James Chadwick",
        description: "solid copper cylinder",
        createdAt: "2020-07-06T08:20:57.523Z",
        sampleCharacteristics: {},
        isPublished: true,
        ownerGroup: "ess",
        accessGroups: ["loki", "odin"],
        createdBy: "ldap.James Chadwick",
        updatedAt: "2020-07-13T09:15:38.619Z",
      },
    ],
  },
  xmlContent: xmlContent,
  querySelectorXml: querySelectorXml
};
