import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

import {
  apiTokenFromAuthHeader,
  checkAdminAccessUnwrapped,
} from "../../security/helpers";

@suite
class SecurityHelpersTest {
  @test public "helpers.apiTokenFromAuthHeader(undefined)"() {
    try {
      apiTokenFromAuthHeader(undefined);
    } catch (err) {
      expect(err.status).to.deep.equal(401);
      expect(err.err.message).to.deep.equal("Missing Authorization header");
    }
  }
  @test public "helpers.apiTokenFromAuthHeader(token=abcdef)"() {
    const token = apiTokenFromAuthHeader("token=abcdef");
    expect(token).to.equal("abcdef");
  }
  @test public async "helpers.checkAdminAccessUnwrapped(undefined)"() {
    await checkAdminAccessUnwrapped(undefined as any)
      .then(() => {
        throw new Error("Error not thrown");
      })
      .catch((err) => {
        expect(err.status).to.deep.equal(401);
        expect(err.err.message).to.deep.equal("Missing Authorization header");
      });
  }
}

export default SecurityHelpersTest;
