import { describe, it } from "mocha";
import { expect } from "chai";
import { stringifyFields } from "../headless";

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

        expect(stringifyFields(input)).to.deep.equal(answer);
    });
});
