
/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 */
exports.getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * If value is a random range, returns a random number inside the range.
 */
exports.numFromRange = (value) => {
  if (value.indexOf(":") > -1) {
    const values = value.split(':');
    return this.getRandomInt(values[0], values[1]);
  } else {
    return value;
  }
};