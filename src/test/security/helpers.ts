import { suite, test } from "@testdeck/mocha";

import { apiTokenFromAuthHeader, checkAdminAccessUnwrapped } from "../../security/helpers";
import assert from "assert";

@suite
class SecurityHelpersTest {
  @test public "helpers.apiTokenFromAuthHeader(undefined)"() {
    try {
      apiTokenFromAuthHeader(undefined);
    } catch (err) {
      assert.strictEqual(err.status, 401);
      assert.strictEqual(err.err.message, "Missing Authorization header");
    }
  }
  @test public "helpers.apiTokenFromAuthHeader(token=abcdef)"() {
    const token = apiTokenFromAuthHeader("token=abcdef");
    assert.strictEqual(token, "abcdef");
  }
  @test public async "helpers.checkAdminAccessUnwrapped(undefined)"() {
    try {
      await checkAdminAccessUnwrapped(undefined as any);
      throw new Error("Error not thrown");
    } catch (err) {
      assert.strictEqual(err.status, 401);
      assert.strictEqual(err.err.message, "Missing Authorization header");
    }
  }
}

export default SecurityHelpersTest;
