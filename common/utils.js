"use strict";

const math = require("mathjs");

/**
 * Get inclusions from filter
 * @param {object} filter PaNOSC loopback filter object
 * @returns {object} Object with primary relation as key and loopback filter object as value
 */

exports.getInclusions = (filter) =>
  filter && filter.include
    ? Object.assign(
      ...filter.include.map((inclusion) =>
        inclusion.scope
          ? { [inclusion.relation]: inclusion.scope }
          : { [inclusion.relation]: {} },
      ),
    )
    : {};

/**
 * Get names of inclusions from filter
 * @param {object} filter PaNOSC loopBack filter object
 * @returns {object} Object with primary relation as key and and an array of secondary relations as value
 */

exports.getInclusionNames = (filter) => {
  const primaryInclusions = filter.include
    ? filter.include
      .filter(
        (primary) =>
          (primary.scope && primary.scope.where) ||
          (primary.scope && primary.scope.include),
      )
      .map(({ relation }) => relation)
    : [];

  return primaryInclusions.length > 0 &&
    filter.include.filter((inclusion) => inclusion.scope).length > 0
    ? Object.assign(
      ...primaryInclusions.map((primary) => ({
        [primary]: [].concat.apply(
          [],
          filter.include.map((inclusion) =>
            inclusion.relation === primary &&
              inclusion.scope &&
              inclusion.scope.include
              ? inclusion.scope.include
                .filter(
                  (secondary) => secondary.scope && secondary.scope.where,
                )
                .map(({ relation }) => relation)
              : [],
          ),
        ),
      })),
    )
    : {};
};

/**
 * Filter out objects in array having all undefined values or return empty object having all values undefined
 * @param {object[]|object} result The result from the LoopBack query relation
 * @returns {object[]|object} Sanitized result
 */

exports.filterObjectsEmptyValues = (result) =>
  Array.isArray(result)
    ? result.filter((item) =>
      Object.values(item).length > 0
        ? Object.values(item).some((v) => v !== undefined)
        : true
    )
    : Object.values(result).some((v) => v !== undefined)
      ? result
      : {};

/**
 * Filter result on primary relation
 * @param {object[]} result The result from the LoopBack query
 * @param {string} primary Name of the primary relation
 * @returns {object[]} Sanitized result
 */

exports.filterOnPrimary = (result, primary) =>
  result.filter(
    (item) =>
      Object.values(this.filterObjectsEmptyValues(item[primary])).length > 0
  );

/**
 * Filter result on secondary relation
 * @param {object[]} result The result from the LoopBack query
 * @param {string} primary Name of the primary relation
 * @param {string} secondary Name of the secondary relation
 * @returns {object[]} Sanitized result
 */

exports.filterOnSecondary = (result, primary, secondary) =>
  result.filter((item) =>
    Array.isArray(item[primary])
      ? (item[primary] = this.filterOnPrimary(item[primary], secondary)) &&
      item[primary].length > 0
      : (Object.keys(item[primary]).length > 0 && item[primary][secondary]
        ? (item[primary][secondary] = this.filterObjectsEmptyValues(
          item[primary][secondary]
        ))
        : null) && Object.keys(item[primary][secondary]).length > 0
  );

/**
 * Convert a quantity to SI units
 * @param {number} value Value to be converted
 * @param {string} unit Unit to be converted
 * @returns {object} Object with with the converted value as `valueSI` and the converted unit as `unitSI`
 */

exports.convertToSI = (value, unit) => {
  const quantity = math.unit(value, unit).toSI().toString();
  const convertedValue = quantity.substring(0, quantity.indexOf(" "));
  const convertedUnit = quantity.substring(quantity.indexOf(" ") + 1);
  return { valueSI: Number(convertedValue), unitSI: convertedUnit };
};

/**
 * Convert a quantity to another unit
 * @param {number} value Value to be converted
 * @param {string} unit Unit to be converted
 * @param {string} toUnit Unit the quantity should be converted to
 * @returns {object} Object with the converted value and unit
 */

exports.convertToUnit = (value, unit, toUnit) => {
  const converted = math.unit(value, unit).to(toUnit);
  const formatted = math.format(converted, { precision: 3 }).toString();
  const formattedValue = formatted.substring(0, formatted.indexOf(" "));
  const formattedUnit = formatted.substring(formatted.indexOf(" ") + 1);
  return { value: Number(formattedValue), unit: formattedUnit };
};

/**
 * Extracts the name, value and unit from parameter where filter
 * @param {object} where PaNOSC parameter where filter object
 * @returns {object} Object with the extracted name, value and unit
 */

exports.extractParamaterFilter = (where) => {
  if (where && where.and) {
    const name = where.and.find((condition) =>
      Object.keys(condition).includes("name"),
    )
      ? where.and.find((condition) => Object.keys(condition).includes("name"))[
        "name"
      ]
      : null;
    const value = where.and.find((condition) =>
      Object.keys(condition).includes("value"),
    )
      ? where.and.find((condition) => Object.keys(condition).includes("value"))[
        "value"
      ]
      : null;
    const unit = where.and.find((condition) =>
      Object.keys(condition).includes("unit"),
    )
      ? where.and.find((condition) => Object.keys(condition).includes("unit"))[
        "unit"
      ]
      : null;
    return { name, value, unit };
  } else {
    return { name: null, value: null, unit: null };
  }
};


/**
 * Creates an object with the name of the parameter as key and values from extractParamaterFilter
 * @param {object} filter PaNOSC parameter where filter object
 * @returns {object} Object with the name of the parameter as key and values from extractParamaterFilter
 */

exports.extractParamaterFilterMapping = (filter) => (
  filter.reduce(
    (o, c) => {
      const parameter = this.extractParamaterFilter(c);
      o[parameter.name] = parameter;
      return o;
    },
    {})
);


/**
 * compare two datasets entry
 * used in sorting the array
 */
exports.compareDatasets = (a, b) => {
  if (a.score > b.score) {
    return -1;
  }
  if (a.score < b.score) {
    return 1;
  }
  if (a.creationDate > b.creationDate) {
    return -1;
  }
  if (a.creationDate < b.creationDate) {
    return 1;
  }
  if (a.title > b.title) {
    return -1;
  }
  if (a.title < b.title) {
    return 1;
  }
  if (a.pid > b.pid) {
    return -1;
  }
  if (a.pid < b.pid) {
    return 1;
  }
  return 0;
};

/**
 * compare two documents entry
 * used in sorting the array
 */
exports.compareDocuments = (a, b) => {
  if (a.score > b.score) {
    return -1;
  }
  if (a.score < b.score) {
    return 1;
  }
  if (a.title > b.title) {
    return -1;
  }
  if (a.title < b.title) {
    return 1;
  }
  if (a.pid > b.pid) {
    return -1;
  }
  if (a.pid < b.pid) {
    return 1;
  }
  return 0;
};
