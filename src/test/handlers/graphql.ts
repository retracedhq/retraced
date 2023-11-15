import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { validateQuery } from "../../handlers/graphql/handler";
import schema from "../../handlers/graphql/schema";

// (specifiedRules as Array<any>).push(NoDuplicateFields);

@suite
export class GraphqlTest {
  @test public "Graphql#validateValidFullSearch()"() {
    const query = `
      query Search($query: String!, $last: Int, $before: String) {
        search(query: $query, last: $last, before: $before) {
          totalCount
          pageInfo {
            hasPreviousPage
          }
          edges {
            cursor
            node {
              id
              action
              crud
              created
              received
              canonical_time
              description
              actor {
                id
                name
                href
              }
              group {
                id
                name
              }
              target {
                id
                name
                href
                type
              }
              display {
                markdown
              }
              is_failure
              is_anonymous
              source_ip
              country
              loc_subdiv1
              loc_subdiv2
            }
          }
        }
      }`;
    const errors = validateQuery(query, schema);
    return expect(errors).to.be.empty;
  }

  @test public "Graphql#validateDupFields()"() {
    const query = `
        query Search($query: String!, $last: Int, $before: String) {
          search(query: $query, last: $last, before: $before) { totalCount totalCount }
        }`;
    const errors = validateQuery(query, schema);
    let r = expect(errors).to.not.be.empty;
    r = expect(String(errors[0])).to.have.string("Error: Duplicate field EventsConnection:totalCount.");
    return r;
  }

  @test public "Graphql#validateAliasOverload()"() {
    const query = `
        query Search($query: String!, $last: Int, $before: String) {
          search(query: $query, last: $last, before: $before) { a1:totalCount a2:totalCount }
        }`;
    const errors = validateQuery(query, schema);
    let r = expect(errors).to.not.be.empty;
    r = expect(String(errors[0])).to.have.string("Error: Duplicate field EventsConnection:totalCount.");
    return r;
  }
}
