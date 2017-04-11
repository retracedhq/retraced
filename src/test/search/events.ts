import "source-map-support/register";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import { parse } from "../../models/event/query";

@suite class SearchEventsTest {
  @test public "search.parse(action:user.get)"() {
    expect(parse("action:user.get")).to.deep.equal({
      bool: {
        filter: [
          {term: {action: "user.get"}},
        ],
      },
    });
  }
  @test public "search.parse(action:user.*)"() {
    expect(parse("action:user.*")).to.deep.equal({
      bool: {
        filter: [
          {prefix: {action: "user."}},
        ],
      },
    });
  }
}
