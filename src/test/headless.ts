import { describe, it } from "mocha";
import { stringifyFields } from "../headless";
import assert from "assert";

describe("stringifyFields", () => {
  it("should stringify non-null, defined fields.", () => {
    const input = {
      key: "value",
      missing: undefined,
      gone: null,
      count: 0,
      active: false,
      dev: true,
    };
    const answer = {
      key: "value",
      count: "0",
      active: "false",
      dev: "true",
    };

    assert.deepEqual(stringifyFields(input), answer);
  });
});
