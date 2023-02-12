import bcrypt from "bcryptjs";
import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

@suite
class BcryptLearning {
  @test
  public async "Bcrypt happy path"() {
    const token = "100";
    const hash = await bcrypt.hash(token, 12);
    const valid = await bcrypt.compare(token, hash);
    return expect(valid).to.be.true;
  }

  @test
  public async "Bcrypt sad path"() {
    const token = "100";
    const hash = await bcrypt.hash(token, 12);
    const valid = await bcrypt.compare(token + token, hash);
    return expect(valid).to.be.false;
  }
}

export default BcryptLearning;
