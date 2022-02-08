"use strict";

const mappings = require("./mappings");
const utils = require("./utils");

/**
 * Map PaNOSC dataset filter to SciCat dataset filter
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} SciCat loopback filter object
 */

exports.dataset = async (filter) => {
  if (!filter) {
    return null;
  } else {
    let scicatFilter = {};
    if (filter.where) {
      scicatFilter.where = mapWhereFilter(filter.where, "dataset");
    }
    if (filter.include) {
      const parameters = filter.include.filter(
        (inclusion) => inclusion.relation === "parameters"
      );
      parameters.forEach(parameter => {
        if (parameter.scope && parameter.scope.where) {
          scicatFilter = mapField(parameter, scicatFilter);
        }
      });

      const techniques = filter.include.find(
        (inclusion) => inclusion.relation === "techniques"
      );
      if (techniques && techniques.scope && techniques.scope.where) {
        scicatFilter = mapField(techniques, scicatFilter);
      }
      const include = filter.include
        .filter((inclusion) => inclusion.relation !== "parameters")
        .filter((inclusion) => inclusion.relation !== "samples")
        .filter((inclusion) => inclusion.relation !== "techniques");
      if (include.length > 0) {
        scicatFilter.include = mapIncludeFilter(include);
      }
    }
    if (filter.skip) {
      scicatFilter.skip = filter.skip;
    }
    if (filter.limit) {
      scicatFilter.limit = filter.limit;
    }
    return scicatFilter;
  }
};

/**
 * Map PaNOSC document filter to SciCat publishedData filter
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} SciCat loopback filter object
 */

exports.document = (filter) => {
  if (!filter) {
    return null;
  } else {
    let scicatFilter = {};
    if (filter.where) {
      if (filter.where.and) {
        filter.where.and = filter.where.and
          .filter((where) => !Object.keys(where).includes("isPublic"))
          .filter((where) => !Object.keys(where).includes("type"));
        if (filter.where.and.length > 0) {
          scicatFilter.where = mapWhereFilter(filter.where, "document");
        }
      } else if (filter.where.or) {
        filter.where.or = filter.where.or
          .filter((where) => !Object.keys(where).includes("isPublic"))
          .filter((where) => !Object.keys(where).includes("type"));
        if (filter.where.or.length > 0) {
          scicatFilter.where = mapWhereFilter(filter.where, "document");
        }
      } else {
        delete filter.where.isPublic;
        delete filter.where.type;
        if (Object.keys(filter.where).length > 0) {
          scicatFilter.where = mapWhereFilter(filter.where, "document");
        }
      }
    }
    if (filter.include) {
      const members = filter.include.find(
        (inclusion) => inclusion.relation === "members"
      );

      if (members && members.scope) {
        scicatFilter = mapMembers(members, scicatFilter);
      }

      const include = filter.include
        .filter((inclusion) => inclusion.relation !== "datasets")
        .filter((inclusion) => inclusion.relation !== "members");
      if (include.length > 0) {
        scicatFilter.include = mapIncludeFilter(include);
      }
    }
    if (filter.skip) {
      scicatFilter.skip = filter.skip;
    }
    if (filter.limit) {
      scicatFilter.limit = filter.limit;
    }
    return scicatFilter;
  }
};

/**
 * Map PaNOSC files filter to SciCat origDatablocks filter
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} SciCat loopback filter object
 */

exports.files = (filter) => {
  let scicatFilter = {};
  if (!filter) {
    scicatFilter.include = [{ relation: "origdatablocks" }];
  } else {
    if (filter.where) {
      scicatFilter.include = [
        { relation: "origdatablocks", scope: { where: filter.where } },
      ];
    } else {
      scicatFilter.include = [{ relation: "origdatablocks" }];
    }
  }
  return scicatFilter;
};

/**
 * Map PaNOSC instrument filter to SciCat instrument filter
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} SciCat loopback filter object
 */

exports.instrument = (filter) => {
  if (!filter) {
    return null;
  } else {
    let scicatFilter = {};
    if (filter.where) {
      if (filter.where.and) {
        filter.where.and = filter.where.and.filter(
          (where) => !Object.keys(where).includes("facility")
        );
      } else if (filter.where.or) {
        filter.where.or = filter.where.or.filter(
          (where) => !Object.keys(where).includes("facility")
        );
      } else {
        if (filter.where.facility) {
          delete filter.where.facility;
        }
      }
      if (Object.keys(filter.where).length > 0) {
        scicatFilter.where = mapWhereFilter(filter.where, "instrument");
      }
    }
    if (filter.include) {
      scicatFilter.include = filter.include;
    }
    if (filter.skip) {
      scicatFilter.skip = filter.skip;
    }
    if (filter.limit) {
      scicatFilter.limit = filter.limit;
    }
    return scicatFilter;
  }
};

/**
 * Map PaNOSC sample filter to SciCat sample filter
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} SciCat loopback filter object
 */

exports.sample = (filter) => {
  if (!filter) {
    return null;
  } else {
    let scicatFilter = {};
    if (filter.where) {
      scicatFilter.where = mapWhereFilter(filter.where, "samples");
    }
    return scicatFilter;
  }
};

/**
 * Map PaNOSC where filter to SciCat where filter
 * @param {object} where PaNOSC loopback where filter object
 * @param {string} model PaNOSC model name
 * @returns {object} SciCat loopback where filter object
 */

const mapWhereFilter = (where, model) => {
  let scicatWhere = {};
  switch (model) {
  case "dataset": {
    if (where.and) {
      scicatWhere.and = where.and.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatDataset[key]]: item[key],
          }))
        )
      );
    } else if (where.or) {
      scicatWhere.or = where.or.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatDataset[key]]: item[key],
          }))
        )
      );
    } else {
      scicatWhere = Object.assign(
        ...Object.keys(where).map((key) => ({
          [mappings.panoscToScicatDataset[key]]: where[key],
        }))
      );
    }
    break;
  }
  case "document": {
    if (where.and) {
      scicatWhere.and = where.and.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatDocument[key]]: item[key],
          }))
        )
      );
    } else if (where.or) {
      scicatWhere.or = where.or.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatDocument[key]]: item[key],
          }))
        )
      );
    } else {
      scicatWhere = Object.assign(
        ...Object.keys(where).map((key) => ({
          [mappings.panoscToScicatDocument[key]]: where[key],
        }))
      );
    }
    break;
  }
  case "files": {
    if (where.and) {
      scicatWhere.and = where.and.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatFile[key]]: item[key],
          }))
        )
      );
    } else if (where.or) {
      scicatWhere.or = where.or.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatFile[key]]: item[key],
          }))
        )
      );
    } else {
      scicatWhere = Object.assign(
        ...Object.keys(where).map((key) => ({
          [mappings.panoscToScicatFile[key]]: where[key],
        }))
      );
    }
    break;
  }
  case "instrument": {
    if (where.and) {
      scicatWhere.and = where.and;
    } else if (where.or) {
      scicatWhere.or = where.or;
    } else {
      scicatWhere = where;
    }
    break;
  }
  case "members": {
    if (where.and) {
      break;
    } else if (where.or) {
      break;
    } else {
      scicatWhere.or = Object.values(where).reduce(
        (value, it) => value.concat({ creator: it }, { authors: it }),
        []
      );
    }
    break;
  }
  case "parameters": {
    if (where.and) {
      const { name, value, unit } = utils.extractParamaterFilter(where);
      if (name) {
        scicatWhere.and = [];
        if (value !== null) {
          if (unit) {
            if (isNaN(value)) {
              const extractedValue = Object.values(value).pop();
              if (Array.isArray(extractedValue)) {
                const arrayValues = extractedValue.map((value) =>
                  utils.convertToSI(value, unit)
                );
                const formattedValueSI = Object.assign(
                  ...Object.keys(value).map((key) => ({
                    [key]: arrayValues.map((item) => item.valueSI),
                  }))
                );
                const unitSI = arrayValues.pop().unitSI;
                scicatWhere.and.push({
                  [`scientificMetadata.${name}.valueSI`]: formattedValueSI,
                });
                scicatWhere.and.push({
                  [`scientificMetadata.${name}.unitSI`]: unitSI,
                });
              } else {
                const { valueSI, unitSI } = utils.convertToSI(
                  extractedValue,
                  unit
                );
                const formattedValueSI = Object.assign(
                  ...Object.keys(value).map((key) => ({ [key]: valueSI }))
                );
                scicatWhere.and.push({
                  [`scientificMetadata.${name}.valueSI`]: formattedValueSI,
                });
                scicatWhere.and.push({
                  [`scientificMetadata.${name}.unitSI`]: unitSI,
                });
              }
            } else {
              const { valueSI, unitSI } = utils.convertToSI(value, unit);
              scicatWhere.and.push({
                [`scientificMetadata.${name}.valueSI`]: valueSI,
              });
              scicatWhere.and.push({
                [`scientificMetadata.${name}.unitSI`]: unitSI,
              });
            }
          } else {
            scicatWhere.and.push({
              "or": [{
                [`scientificMetadata.${name}.value`]: value
              },
              {
                [`scientificMetadata.${name}.v`]: value
              }]
            });
          }
        } else {
          const err = new Error();
          err.name = "FilterError";
          err.message = "Parameter value was not provided";
          err.statusCode = 400;
          throw err;
        }
      } else {
        const err = new Error();
        err.name = "FilterError";
        err.message = "Parameter name was not provided";
        err.statusCode = 400;
        throw err;
      }
    } else if (where.or) {
      const parameters = where.or.map((condition) =>
        utils.extractParamaterFilter(condition)
      );
      const scientificMetadata = parameters.map(({ name, value, unit }) => {
        if (name) {
          const filter = { and: [] };
          if (value !== null) {
            if (unit) {
              if (isNaN(value)) {
                const extractedValue = Object.values(value).pop();
                if (Array.isArray(extractedValue)) {
                  const arrayValues = extractedValue.map((value) =>
                    utils.convertToSI(value, unit)
                  );
                  const formattedValueSI = Object.assign(
                    ...Object.keys(value).map((key) => ({
                      [key]: arrayValues.map((item) => item.valueSI),
                    }))
                  );
                  const unitSI = arrayValues.pop().unitSI;
                  filter.and.push({
                    [`scientificMetadata.${name}.valueSI`]: formattedValueSI,
                  });
                  filter.and.push({
                    [`scientificMetadata.${name}.unitSI`]: unitSI,
                  });
                } else {
                  const { valueSI, unitSI } = utils.convertToSI(
                    extractedValue,
                    unit
                  );
                  const formattedValueSI = Object.assign(
                    ...Object.keys(value).map((key) => ({ [key]: valueSI }))
                  );
                  filter.and.push({
                    [`scientificMetadata.${name}.valueSI`]: formattedValueSI,
                  });
                  filter.and.push({
                    [`scientificMetadata.${name}.unitSI`]: unitSI,
                  });
                }
              } else {
                const { valueSI, unitSI } = utils.convertToSI(value, unit);
                filter.and.push({
                  [`scientificMetadata.${name}.valueSI`]: valueSI,
                });
                filter.and.push({
                  [`scientificMetadata.${name}.unitSI`]: unitSI,
                });
              }
            } else {
              filter.and.push({
                "or": [{
                  [`scientificMetadata.${name}.value`]: value
                },
                {
                  [`scientificMetadata.${name}.v`]: value
                }]
              });
            }
            return filter;
          } else {
            const err = new Error();
            err.name = "FilterError";
            err.message = "Parameter value vas not provided";
            err.statusCode = 400;
            throw err;
          }
        } else {
          const err = new Error();
          err.name = "FilterError";
          err.message = "Parameter name was not provided";
          err.statusCode = 400;
          throw err;
        }
      });
      if (
        scientificMetadata.some((condition) =>
          Object.keys(condition).includes("and")
        )
      ) {
        scicatWhere.or = scientificMetadata;
      } else {
        if (scicatWhere.and) {
          scicatWhere.and.push(scientificMetadata);
        } else {
          scicatWhere.and = scientificMetadata;
        }
      }
    } else {
      const err = new Error();
      err.name = "FilterError";
      err.message = "Parameter filter requires at least a name and a value";
      err.statusCode = 400;
      throw err;
    }
    break;
  }
  case "samples": {
    if (where.and) {
      scicatWhere.and = where.and.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatSample[key]]: item[key],
          }))
        )
      );
    } else if (where.or) {
      scicatWhere.or = where.or.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatSample[key]]: item[key],
          }))
        )
      );
    } else {
      scicatWhere = Object.assign(
        ...Object.keys(where).map((key) => ({
          [mappings.panoscToScicatSample[key]]: where[key],
        }))
      );
    }
    break;
  }
  case "techniques": {
    if (where.and) {
      scicatWhere.and = where.and.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatTechniques[key]]: item[key],
          }))
        )
      );
    } else if (where.or) {
      scicatWhere.or = where.or.map((item) =>
        Object.assign(
          ...Object.keys(item).map((key) => ({
            [mappings.panoscToScicatTechniques[key]]: item[key],
          }))
        )
      );
    } else {
      scicatWhere = Object.assign(
        ...Object.keys(where).map((key) => ({
          [mappings.panoscToScicatTechniques[key]]: where[key],
        }))
      );
    }
    break;
  }
  }
  return scicatWhere;
};

/**
 * Map PaNOSC include filter to SciCat include filter
 * @param {object} include PaNOSC loopback include filter object
 * @returns {object} SciCat loopback include filter object
 */

const mapIncludeFilter = (include) =>
  include.map((item) => {
    let inclusion = {};
    switch (item.relation) {
    case "files": {
      inclusion.relation = "origdatablocks";
      if (item.scope) {
        inclusion.scope = {};
        if (item.scope.where) {
          inclusion.scope.where = mapWhereFilter(
            item.scope.where,
            item.relation
          );
        }
      }
      break;
    }
    case "instrument": {
      inclusion.relation = "instrument";
      if (item.scope) {
        if (item.scope.where && item.scope.where.facility) {
          delete item.scope.where.facility;
        }
        inclusion.scope = item.scope;
      }
      break;
    }
    }
    return inclusion;
  });

/**
 * Map PaNOSC field to SciCat field
 * @param {object} field PaNOSC loopback field filter object
 * @param {object} filter SciCat loopback filter object
 * @returns {object} SciCat loopback filter object
 */

const mapField = (field, filter) => {
  if (filter.where) {
    const scicatField =
      field.relation === "parameters"
        ? mapWhereFilter(field.scope.where, field.relation)["and"]
        : mapWhereFilter(field.scope.where, field.relation);
    if (filter.where.and) {
      filter.where.and = filter.where.and.concat(scicatField);
    } else if (filter.where.or) {
      filter.where.and = scicatField.concat({ or: filter.where.or });
      delete filter.where.or;
    } else {
      filter.where = { and: scicatField.concat(filter.where) };
    }
  } else {
    filter.where = mapWhereFilter(field.scope.where, field.relation);
  }
  return filter;
};

/**
 * Map PaNOSC member filter to SciCat member filter
 * @param {object} members PaNOSC loopback member filter object
 * @param {object} filter SciCat loopback filter object
 * @returns {object} SciCat loopback filter object
 */

const mapMembers = (members, filter) => {
  const person = members.scope.include.find(
    (inclusion) => inclusion.relation === "person"
  );
  if (person.scope && person.scope.where) {
    if (filter.where) {
      const scicatMembers = mapWhereFilter(
        person.scope.where,
        members.relation
      );
      if (filter.where.and) {
        filter.where.and = filter.where.and.concat(scicatMembers);
      } else if (filter.where.or) {
        filter.where.and = scicatMembers.concat({
          or: filter.where.or,
        });
        delete filter.where.or;
      } else {
        filter.where = { and: scicatMembers.concat(filter.where) };
      }
    } else {
      filter.where = mapWhereFilter(person.scope.where, members.relation);
    }
  }
  return filter;
};
