import assert from "assert";
import { offsetsWithLocalTimeDuringUTCHour } from "../common";

describe("common.offsetsWithLocalTimeDuringUTCHour", () => {
  const tests: [number, number, number[]][] = [
    // UTC Hour, local hour, answer
    [16, 7, [-9]],
    [17, 7, [-10, 14]],
    [18, 7, [-11, 13]],
    [19, 7, [-12, 12]],
    [20, 7, [11]],
    [23, 7, [8]],
    [0, 7, [7]],
    [7, 7, [0]],
    [8, 7, [-1]],
  ];

  tests.forEach((t) => {
    const [utcHour, localHour, answer] = t;

    describe(`(UTC hour ${utcHour}, local hour ${localHour})`, () => {
      it(`=> ${JSON.stringify(answer)}`, () => {
        const output = offsetsWithLocalTimeDuringUTCHour(utcHour, localHour);

        assert.deepEqual(output, answer);
      });
    });
  });
});
