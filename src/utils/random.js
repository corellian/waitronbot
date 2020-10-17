import { Random as RandomJS, nodeCrypto } from 'random-js';

const engine = new RandomJS(nodeCrypto);

export class Random {
  
  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   */
  static numBetween(min, max) {
    if (min === max) return min;
    if (min > max) {
      [min, max] = [max, min];
    }

    return engine.integer(min, max);
  }

  /**
   * If value is a random range, returns a random number inside the range.
   */
  static numFromRange(value) {
    if (value.indexOf(":") > -1) {
      const values = value.split(":");
      return Random.numBetween(+values[0], +values[1]);
    } else {
      return +value;
    }
  }
}
