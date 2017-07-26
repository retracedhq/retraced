import "source-map-support/register";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import {
  parse,
  searchParams,
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

  @test public "parse(action:user.* crud:c,d)"() {
    expect(parse("action:user.* crud:c,d")).to.deep.equal({
      bool: {
        filter: [
          {prefix: {action: "user."}},
          {
            bool: {
              should: [
                {term: {crud: "c"}},
                {term: {crud: "d"}},
              ],
            },
          },
        ],
      },
    });
  }

  @test public "parse(crud:r)"() {
    expect(parse("crud:r")).to.deep.equal({
      bool: {
        filter: [
          { term: { crud: "r" }},
        ],
      },
    });
  }

  @test public "parse(received:2017-01-01,2018-01-01)"() {
    expect(parse("received:2017-01-01,2018-01-01")).to.deep.equal({
      bool: {
        filter: [
          {
            range: {
              received: {
                gte: 1483228800000,
                lt: 1514764800000,
              },
            },
          },
        ],
      },
    });
  }

  @test public "parse(created:2017-01-01,2018-01-01)"() {
    expect(parse("created:2017-01-01,2018-01-01")).to.deep.equal({
      bool: {
        filter: [
          {
            range: {
              created: {
                gte: 1483228800000,
                lt: 1514764800000,
              },
            },
          },
        ],
      },
    });
  }

  @test public "parse(actor.id:b82c4cfa428342ac822c42c1f6b89200)"() {
    expect(parse("actor.id:b82c4cfa428342ac822c42c1f6b89200")).to.deep.equal({
      bool: {
        filter: [
          { term: { "actor.id": "b82c4cfa428342ac822c42c1f6b89200" }},
        ],
      },
    });
  }

  @test public "parse(actor.name:\"Mario Nguyen\")"() {
    expect(parse(`actor.name:"Mario Nguyen"`)).to.deep.equal({
      bool: {
        filter: [
          { match: { "actor.name": "Mario Nguyen" }},
        ],
      },
    });
  }

  @test public "parse(description:\"debit credt\")"() {
    expect(parse(`description:"debit credit"`)).to.deep.equal({
      bool: {
        filter: [
          { match: { description: "debit credit" }},
        ],
      },
    });
  }

  @test public "parse(location:\"Los Angeles\")"() {
    expect(parse(`location:"Los Angeles"`)).to.deep.equal({
      bool: {
        filter: [
          {
            multi_match: {
              query: "Los Angeles",
              fields: ["country", "loc_subdiv1", "loc_subdiv2"],
            },
          },
        ],
      },
    });
  }

  @test public "parse(some free text)"() {
    expect(parse("some free text")).to.deep.equal({
      bool: {
        filter: [
          {
            multi_match: {
              query: "some free text",
              fields: ["_all"],
            },
          },
        ],
      },
    });
  }

  @test public "parse(action:login plus some free text)"() {
    expect(parse("action:login plus some free text")).to.deep.equal({
      bool: {
        filter: [
          {term: {action: "login"}},
          {
            multi_match: {
              query: "plus some free text",
              fields: ["_all"],
            },
          },
        ],
      },
    });
  }

  @test public "searchParams"() {
    const input: Options = {
      query: "action:user.get",
      size: 10,
      sort: "asc",
      scope: {
        projectId: "p1",
        environmentId: "e1",
        groupId: "g1",
        targetId: "t1",
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
                term: {"target.id": "t1"},
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
