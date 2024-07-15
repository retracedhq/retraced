import { suite, test } from "@testdeck/mocha";

import { parse, searchParams, Options } from "../../../models/event/query";
import { RequestParams } from "@opensearch-project/opensearch";
import assert from "assert";

@suite
class QueryEventsTest {
  @test public "parse(action:user.get)"() {
    assert.deepEqual(parse("action:user.get"), {
      bool: {
        filter: [{ match: { action: { query: "user.get", operator: "and" } } }],
      },
    });
  }

  @test public "parse(action:user.* crud:c,d)"() {
    assert.deepEqual(parse("action:user.* crud:c,d"), {
      bool: {
        filter: [
          { prefix: { action: "user." } },
          {
            bool: {
              should: [{ match: { crud: "c" } }, { match: { crud: "d" } }],
            },
          },
        ],
      },
    });
  }

  @test public "parse(crud:r)"() {
    assert.deepEqual(parse("crud:r"), {
      bool: {
        filter: [{ match: { crud: "r" } }],
      },
    });
  }

  @test public "parse(received:2017-01-01,2018-01-01)"() {
    assert.deepEqual(parse("received:2017-01-01,2018-01-01"), {
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
    assert.deepEqual(parse("created:2017-01-01,2018-01-01"), {
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
    assert.deepEqual(parse("actor.id:b82c4cfa428342ac822c42c1f6b89200"), {
      bool: {
        filter: [
          {
            match: {
              "actor.id": {
                query: "b82c4cfa428342ac822c42c1f6b89200",
                operator: "and",
              },
            },
          },
        ],
      },
    });
  }

  @test public 'parse(actor.name:"Mario Nguyen")'() {
    assert.deepEqual(parse(`actor.name:"Mario Nguyen"`), {
      bool: {
        filter: [{ match: { "actor.name": "Mario Nguyen" } }],
      },
    });
  }

  @test public 'parse(description:"debit credit")'() {
    assert.deepEqual(parse(`description:"debit credit"`), {
      bool: {
        filter: [{ match: { description: "debit credit" } }],
      },
    });
  }

  @test public 'parse(location:"Los Angeles")'() {
    assert.deepEqual(parse(`location:"Los Angeles"`), {
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
    assert.deepEqual(parse("some free text"), {
      bool: {
        filter: [
          {
            query_string: {
              query: "some free text",
              default_operator: "and",
            },
          },
        ],
      },
    });
  }

  @test public "parse(action:login plus some free text)"() {
    assert.deepEqual(parse("action:login plus some free text"), {
      bool: {
        filter: [
          { match: { action: { query: "login", operator: "and" } } },
          {
            query_string: {
              query: "plus some free text",
              default_operator: "and",
            },
          },
        ],
      },
    });
  }

  @test public searchParams() {
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
    const answer: RequestParams.Search = {
      index: "retraced.p1.e1.current",
      _source: "true",
      size: 10,
      body: {
        query: {
          bool: {
            filter: [
              // user's query filters
              { match: { action: { query: "user.get", operator: "and" } } },
              // group scope filters
              {
                bool: {
                  should: [
                    { match: { "group.id": { query: "g1", operator: "and" } } },
                    { match: { team_id: { query: "g1", operator: "and" } } },
                  ],
                },
              },
              {
                match: { "target.id": { query: "t1", operator: "and" } },
              },
              // target scope filters
              {
                bool: {
                  must_not: {
                    range: {
                      received: {
                        lt: 1492060162148,
                      },
                    },
                  },
                },
              },
              {
                bool: {
                  should: [
                    {
                      range: {
                        received: {
                          gt: 1492060162148,
                        },
                      },
                    },
                    {
                      range: {
                        id: {
                          gt: "abc123",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        sort: [{ received: "asc" }, { canonical_time: "asc" }],
      },
    };
    assert.deepEqual(output, answer);
  }
}

export default QueryEventsTest;
