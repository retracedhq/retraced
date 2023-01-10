import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

import Event from "../../../models/event/";
import computeCanonicalHash from "../../../models/event/canonicalize";

@suite
class CanonicalizeTest {
  @test public "Anonymous Event Without Group"() {
    const event: Event = { id: "kfbr392", action: "largeTazoTea.purchase" };
    const expected =
      "a60b49fcbbe8569139b97997eaf8fc0b871d2bb88757ef94eae0056fd9326302";
    expect(computeCanonicalHash(event)).to.equal(expected);
  }

  @test public "Anonymous Event With Group"() {
    const group: any = { id: "gold-street-id", name: "Gold Street Cafe" }; // no id
    const event: Event = {
      id: "kfbr392",
      action: "largeTazoTea.purchase",
      group,
    };
    const expected =
      "f17fe3079e5fe34668629f0254a0cabe7ad37ec51d97f034ec8b732e158247d6";
    expect(computeCanonicalHash(event)).to.equal(expected);
  }

  @test public "Fails without event.id "() {
    const event: any = { action: "largeTazoTea.purchase" }; // no id
    const error = `Canonicalization failed: missing required event attribute 'id'`;

    expect(() => computeCanonicalHash(event)).to.throw(error);
  }

  @test public "Fails with event.group and not event.group.id "() {
    const group: any = { name: "Gold Street Cafe" }; // no id
    const event: Event = {
      id: "kfbr392",
      action: "largeTazoTea.purchase",
      group,
    };
    const error = `Canonicalization failed: missing attribute 'group.id' which is required when 'group' is present`;

    expect(() => computeCanonicalHash(event)).to.throw(error);
  }
}

export default CanonicalizeTest;
