import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import { NoDuplicateFields } from "../../handlers/graphql/handler";
import schema from "../../handlers/graphql/schema";
import { parse, validate } from "graphql";
import { specifiedRules } from "graphql/validation";

specifiedRules.push(NoDuplicateFields);

@suite class GraphqlTest {
    @test public async "Graphql#validateValidFullSearch()"() {
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

        var documentAST = parse(query);
        const errors = validate(schema, documentAST);
        expect(errors).to.be.empty;
    }

    @test public async "Graphql#validateDupFields()"() {
        const query = `
        query Search($query: String!, $last: Int, $before: String) {
          search(query: $query, last: $last, before: $before) { totalCount totalCount }
        }`;
        var documentAST = parse(query);
        const errors = validate(schema, documentAST);
        expect(errors).to.not.be.empty;
        expect(String(errors[0])).to.have.string("Error: Duplicate field EventsConnection:totalCount.");
    }

    @test public async "Graphql#validateAliasOverload()"() {
        const query = `
        query Search($query: String!, $last: Int, $before: String) {
          search(query: $query, last: $last, before: $before) { a1:totalCount a2:totalCount }
        }`;
        var documentAST = parse(query);
        const errors = validate(schema, documentAST);
        expect(errors).to.not.be.empty;
        expect(String(errors[0])).to.have.string("Error: Duplicate field EventsConnection:totalCount.");
    }
}

