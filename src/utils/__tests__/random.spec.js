import { Random } from '../random';

describe("Get a random number between an interval", () => {
  it("should return the same number if the range is n:n", () => {
    const inputs = [
      1, 4, 9, 343, 234, 76, 0, -1
    ];
    inputs.forEach((input) => {
      expect(Random.numBetween(input, input)).toEqual(input);
    });
  });

  it("should return a number inside the interval", () => {
    const inputs = [
      [1, 3], [1, 100], [4, 9], [20, 60], [100, 100], [435, 436], [223, 223]
    ];
    inputs.forEach((input) => {
      const output = Random.numBetween(input[0], input[1]);
      expect(output).toBeGreaterThanOrEqual(input[0]);
      expect(output).toBeLessThanOrEqual(input[1]);
    });
  });

  it("should return a number inside the interval also if first parameter is greater than the second", () => {
    const inputs = [
      [3, 1], [56, 2], [60, 0], [32, 31], [400, 3], [10, 5]
    ];
    inputs.forEach((input) => {
      const output = Random.numBetween(input[0], input[1]);
      expect(output).toBeGreaterThanOrEqual(input[1]);
      expect(output).toBeLessThanOrEqual(input[0]);
    });
  });

  it("should return an acceptable randomness of numbers", () => {
    const n0 = 0;
    const n = 7;
    const numberOfCalls = 100000;
    const acceptablePercentage = 1/(n + 1) * 100;
    // Histogram skeleton
    const histogram = Array(n + 1).fill(0);
    // Build an histogram
    for (let i = 0; i < numberOfCalls; i += 1) {
      const randomNum = Random.numBetween(n0, n);
      histogram[randomNum] += 1;
    }
    // Check percentages close to an acceptable percentage (abs error margin -+0.3)
    histogram.forEach(value => {
      const percentage = (value / numberOfCalls) * 100;
      expect(percentage).toBeCloseTo(acceptablePercentage, 0.3);
    });
  });
});

describe("Get a num from string range n1:n2", () => {
  it("should return the same value (number) if is not a range", () => {
    const input = "32";
    const output = 32;
    expect(Random.numFromRange(input)).toBe(output);
  });

  it("should return a number value inside of range", () => {
    const input = "7:20";
    const value = Random.numFromRange(input);
    expect(typeof value).toEqual('number');
    expect(value).toBeLessThanOrEqual(20);
    expect(value).toBeGreaterThanOrEqual(7);
  });
});