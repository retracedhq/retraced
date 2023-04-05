import util from "util";
import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

import { parseQuery } from "../../../models/event";
import { getFilters } from "../../../models/event/filter";

const minScope = {
  projectId: "proj1",
  environmentId: "env1",
};

const tests = [
  {
    query: "action:foo.get",
    parsed: {
      actions: [{ term: "foo.get", isPrefix: false }],
    },
    scope: minScope,
    filters: [
      {
        where: "(doc -> 'action')::text = $1",
        values: ['"foo.get"'],
      },
      { where: "project_id = $2", values: ["proj1"] },
      { where: "environment_id = $3", values: ["env1"] },
    ],
  },
  {
    query: "action:foo.*",
    parsed: {
      actions: [{ term: "foo.", isPrefix: true }],
    },
    scope: minScope,
    filters: [
      {
        where: "(doc -> 'action')::text LIKE $1",
        values: ['"foo.%"'],
      },
      { where: "project_id = $2", values: ["proj1"] },
      { where: "environment_id = $3", values: ["env1"] },
    ],
  },
  {
    query: "action:auth.login,auth.logout,delete.*",
    parsed: {
      actions: [
        { term: "auth.login", isPrefix: false },
        { term: "auth.logout", isPrefix: false },
        { term: "delete.", isPrefix: true },
      ],
    },
    scope: minScope,
    filters: [
      {
        where:
          "((doc -> 'action')::text = $1 OR (doc -> 'action')::text = $2 OR (doc -> 'action')::text LIKE $3)",
        values: ['"auth.login"', '"auth.logout"', '"delete.%"'],
      },
      { where: "project_id = $4", values: ["proj1"] },
      { where: "environment_id = $5", values: ["env1"] },
    ],
  },
  {
    query: "crud:r",
    parsed: {
      crud: ["r"],
    },
    scope: minScope,
    filters: [
      {
        where: `(doc -> 'crud') @> $1`,
        values: ['"r"'],
      },
      { where: "project_id = $2", values: ["proj1"] },
      { where: "environment_id = $3", values: ["env1"] },
    ],
  },
  {
    query: "crud:c,u,d",
    parsed: {
      crud: ["c", "u", "d"],
    },
    scope: minScope,
    filters: [
      {
        where: `((doc -> 'crud') @> $1 OR (doc -> 'crud') @> $2 OR (doc -> 'crud') @> $3)`,
        values: ['"c"', '"u"', '"d"'],
      },
      { where: "project_id = $4", values: ["proj1"] },
      { where: "environment_id = $5", values: ["env1"] },
    ],
  },
  {
    query: "received:2017-06-01,2017-07-01",
    parsed: {
      received: [1496275200000, 1498867200000],
    },
    scope: minScope,
    filters: [
      {
        where: "(doc -> 'received')::text::bigint >= $1 AND (doc -> 'received')::text::bigint < $2",
        values: [1496275200000, 1498867200000],
      },
      { where: "project_id = $3", values: ["proj1"] },
      { where: "environment_id = $4", values: ["env1"] },
    ],
  },
  {
    query: "created:2017-06-01,2017-07-01",
    parsed: {
      created: [1496275200000, 1498867200000],
    },
    scope: minScope,
    filters: [
      {
        where: "(doc -> 'created')::text::bigint >= $1 AND (doc -> 'created')::text::bigint < $2",
        values: [1496275200000, 1498867200000],
      },
      { where: "project_id = $3", values: ["proj1"] },
      { where: "environment_id = $4", values: ["env1"] },
    ],
  },
  {
    query: "actor.id:494a11024a434bdbb0ebeb11f7ff5cf4",
    parsed: {
      actor_id: ["494a11024a434bdbb0ebeb11f7ff5cf4"],
    },
    scope: minScope,
    filters: [
      {
        where: `(doc -> 'actor' -> 'id') @> $1`,
        values: ['"494a11024a434bdbb0ebeb11f7ff5cf4"'],
      },
      { where: "project_id = $2", values: ["proj1"] },
      { where: "environment_id = $3", values: ["env1"] },
    ],
  },
  {
    query: "actor.id:foo@example.com,bar@example.com",
    parsed: {
      actor_id: ["foo@example.com", "bar@example.com"],
    },
    scope: minScope,
    filters: [
      {
        where: `((doc -> 'actor' -> 'id') @> $1 OR (doc -> 'actor' -> 'id') @> $2)`,
        values: ['"foo@example.com"', '"bar@example.com"'],
      },
      { where: "project_id = $3", values: ["proj1"] },
      { where: "environment_id = $4", values: ["env1"] },
    ],
  },
  {
    query: `actor.name:Reese,Tracy`,
    parsed: {
      actor_name: ["Reese", "Tracy"],
    },
    scope: minScope,
    filters: [
      {
        where: `(to_tsvector('english', (doc -> 'actor' -> 'name')) @@ plainto_tsquery('english', $1) OR to_tsvector('english', (doc -> 'actor' -> 'name')) @@ plainto_tsquery('english', $2))`,
        values: ["Reese", "Tracy"],
      },
      { where: "project_id = $3", values: ["proj1"] },
      { where: "environment_id = $4", values: ["env1"] },
    ],
  },
  {
    query: "description:'download secret'",
    parsed: {
      description: ["download secret"],
    },
    scope: minScope,
    filters: [
      {
        where: "to_tsvector('english', (doc -> 'description')) @@ plainto_tsquery('english', $1)",
        values: ["download secret"],
      },
      { where: "project_id = $2", values: ["proj1"] },
      { where: "environment_id = $3", values: ["env1"] },
    ],
  },
  {
    query: "some free text",
    parsed: {
      text: "some free text",
    },
    scope: minScope,
    filters: [
      {
        where: "to_tsvector('english', doc) @@ plainto_tsquery('english', $1)",
        values: ["some free text"],
      },
      { where: "project_id = $2", values: ["proj1"] },
      { where: "environment_id = $3", values: ["env1"] },
    ],
  },
  // scope with a groupId and targetId
  {
    query: "crud:r",
    parsed: {
      crud: ["r"],
    },
    scope: {
      projectId: "proj1",
      environmentId: "env1",
      groupId: "group1",
      targetId: "target1",
    },
    filters: [
      {
        where: `(doc -> 'crud') @> $1`,
        values: ['"r"'],
      },
      { where: "project_id = $2", values: ["proj1"] },
      { where: "environment_id = $3", values: ["env1"] },
      { where: "(doc -> 'group' -> 'id') @> $4", values: ['"group1"'] },
      { where: "(doc -> 'target' -> 'id') @> $5", values: ['"target1"'] },
    ],
  },
];

@suite
class FilterEventsTest {
  @test public "parseQuery() getFilters()"() {
    tests.forEach((testObj) => {
      const parsed = parseQuery(testObj.query);

      try {
        expect(parsed).to.deep.equal(testObj.parsed);
      } catch (err) {
        throw new Error(`"${testObj.query}" parseQuery() =>
${util.inspect(parsed, { depth: 10 })}
    WANT:
${util.inspect(testObj.parsed, { depth: 10 })}`);
      }

      const filters = getFilters(parsed, testObj.scope);

      try {
        expect(filters).to.deep.equal(testObj.filters);
      } catch (err) {
        throw new Error(`"${testObj.query}" getFilters() =>
${util.inspect(filters, { depth: 10 })}
    WANT:
${util.inspect(testObj.filters, { depth: 10 })}`);
      }
    });
  }
}

export default FilterEventsTest;
