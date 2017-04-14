import "source-map-support/register";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import {
  parse,
  scopeFilters,
  searchParams,
  polyfillSearchAfter,
  Options,
} from "../../../models/event/query";

@suite class QueryEventsTest {

  @test public "parse(action:user.get)"() {
    expect(parse("action:user.get")).to.deep.equal({
      bool: {
        filter: [
          {term: {action: "user.get"}},
        ],
      },
    });
  }

  @test public "parse(action:user.*)"() {
    expect(parse("action:user.*")).to.deep.equal({
      bool: {
        filter: [
          {prefix: {action: "user."}},
        ],
      },
    });
  }

  @test public "scopeFilters(groupIds=[g1], targetIds=[t1,t2])"() {
    const output = scopeFilters({
      projectId: "p1",
      environmentId: "e1",
      groupIds: ["g1"],
      targetIds: ["t1", "t2"],
    });
    expect(output).to.have.length(2);
    expect(output[0]).to.deep.equal({
      bool: {
        should: [
          { term: {"group.id": "g1"}},
          { term: {team_id: "g1"}},
        ],
      },
    });
    expect(output[1]).to.deep.equal({
      bool: {
        should: [
          { term: {"target.id": "t1"}},
          { term: {"target.id": "t2"}},
        ],
      },
    });
  }

  @test public "scopeFilters(groupIds=[], targetIds=[])"() {
    const output = scopeFilters({
      projectId: "p1",
      environmentId: "e1",
      groupIds: [],
      targetIds: [],
    });

    expect(output).to.deep.equal([]);
  }

  @test public "searchParams"() {
    const input: Options = {
      query: "action:user.get",
      size: 10,
      sort: "asc",
      scope: {
        projectId: "p1",
        environmentId: "e1",
        groupIds: ["g1"],
        targetIds: ["t1"],
      },
      cursor: [1492060162148, "abc123"],
    };
    const output = searchParams(input);
    const answer = {
      index: "retraced.p1.e1",
      type: "event",
      _source: true,
      size: 10,
      sort: ["canonical_time:asc", "id:asc"],
      search_after: [1492060162148, "abc123"],
      body: {
        query: {
          bool: {
            filter: [
              // user's query filters
              {term: {action: "user.get"}},
              // group scope filters
              {
                bool: {
                  should: [
                    { term: {"group.id": "g1"}},
                    { term: {team_id: "g1"}},
                  ],
                },
              },
              {
                bool: {
                  should: [
                    { term: {"target.id": "t1"}},
                  ],
                },
              },
              // target scope filters
            ],
          },
        },
      },
    };
    expect(output).to.deep.equal(answer);
  }
}
