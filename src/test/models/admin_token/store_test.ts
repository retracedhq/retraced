import * as bcrypt from "bcryptjs";
import { suite, test } from "mocha-typescript";
import { expect } from "chai";

@suite
class BcryptLearning {

  @test
  public async "Bcrypt happy path"() {
    const token = "100";
    const hash = await bcrypt.hash(token, 12);
    const valid = await bcrypt.compare(token, hash);
    expect(valid).to.be.true;
  }

  @test
  public async "Bcrypt sad path"() {
    const token = "100";
    const hash = await bcrypt.hash(token, 12);
    const valid = await bcrypt.compare(token + token, hash);
    expect(valid).to.be.false;
  }
}
