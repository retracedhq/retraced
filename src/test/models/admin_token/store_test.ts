import bcrypt from "bcryptjs";
import { suite, test } from "@testdeck/mocha";
import assert from "assert";

@suite
class BcryptLearning {
  @test
  public async "Bcrypt happy path"() {
    const token = "100";
    const hash = await bcrypt.hash(token, 12);
    const valid = await bcrypt.compare(token, hash);
    assert.strictEqual(valid, true);
  }

  @test
  public async "Bcrypt sad path"() {
    const token = "100";
    const hash = await bcrypt.hash(token, 12);
    const valid = await bcrypt.compare(token + token, hash);
    assert.strictEqual(valid, false);
  }
}

export default BcryptLearning;
