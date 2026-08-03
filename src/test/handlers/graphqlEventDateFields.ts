import { suite, test } from "mocha-typescript";
import { expect } from "chai";
import { GraphQLObjectType } from "graphql";
import schema from "../../handlers/graphql/schema";

function resolveEventField(fieldName: string, source: any) {
  const eventType = schema.getType("Event") as GraphQLObjectType;
  const field = eventType.getFields()[fieldName];
  return (field.resolve as any)(source, {}, {}, {});
}

// Regression test for the "Invalid date" bug: on Postgres 14+, EXTRACT() returns `numeric`
// instead of `double precision`, and the Postgres client returns `numeric` columns as
// fixed-scale decimal strings (e.g. "1716818433375.000000") rather than numbers. Passing
// that string straight into moment.utc() produces "Invalid date". received/created/
// canonical_time must coerce to Number before formatting so both numeric-string and
// plain-number inputs resolve to the same timestamp.
@suite class GraphqlEventDateFieldsTest {
  @test public "received: numeric-string epoch (Postgres 14+ shape) formats correctly, not Invalid date"() {
    const formatted = resolveEventField("received", { received: "1716818433375.000000" });
    expect(formatted).to.equal("2024-05-27T14:00:33Z");
  }

  @test public "received: plain-number epoch (pre-fix / Postgres <14 shape) still formats correctly"() {
    const formatted = resolveEventField("received", { received: 1716818433375 });
    expect(formatted).to.equal("2024-05-27T14:00:33Z");
  }

  @test public "canonical_time: inherits the same numeric-string shape via the received fallback"() {
    const formatted = resolveEventField("canonical_time", { canonical_time: "1716818433375.000000" });
    expect(formatted).to.equal("2024-05-27T14:00:33Z");
  }

  @test public "created: numeric-string epoch also formats correctly"() {
    const formatted = resolveEventField("created", { created: "1716818433375.000000" });
    expect(formatted).to.equal("2024-05-27T14:00:33Z");
  }

  @test public "received: falsy input is not formatted"() {
    expect(resolveEventField("received", { received: null })).to.equal(null);
    expect(resolveEventField("received", {})).to.equal(undefined);
  }
}
