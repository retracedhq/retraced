import { suite, test } from "@testdeck/mocha";

import { AdminUserBootstrap } from "../../../handlers/admin/AdminUserBootstrap";
import assert from "assert";

// const adminUserBootstrap = TypeMoq.Mock.ofType(AdminUserBootstrap);

@suite
class AdminUserBootstrapTest {
  @test
  public "AdminUserBootstrap#AdminUserBootstrap() gets initialized"() {
    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      return assert.strictEqual(adminUserBootstrap !== null, true);
    } catch (err) {
      console.log(err);
    }
  }

  @test
  public async "AdminUserBootstrap#handle() throws if token is not found"() {
    const expected = new Error("Not Found");

    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      await adminUserBootstrap.handle("", {
        email: "",
        upstreamToken: "",
        inviteId: "",
      });
    } catch (err) {
      assert.strictEqual(err.err.message, expected.message);
      assert.strictEqual(err.status, 404);
    }
  }

  @test
  public async "AdminUserBootstrap#handle() throws if token is not valid"() {
    const expected = new Error("Not Found");

    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      await adminUserBootstrap.handle("token=not_shared_secret", {
        email: "",
        upstreamToken: "",
        inviteId: "",
      });
    } catch (err) {
      assert.strictEqual(err.err.message, expected.message);
      assert.strictEqual(err.status, 404);
    }
  }

  @test
  public async "AdminUserBootstrap#handle() throws if claims has not valid email"() {
    const expected = new Error("Missing or invalid parameter: `claims.email`");

    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      await adminUserBootstrap.handle("token=test", {
        email: "",
        upstreamToken: "",
        inviteId: "",
      });
    } catch (err) {
      assert.strictEqual(err.err.message, expected.message);
      assert.strictEqual(err.status, 400);
    }
  }

  @test public async "AdminUserBootstrap#handle()"() {
    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      await adminUserBootstrap.handle("token=test", {
        email: "test@test.com",
        upstreamToken: "",
        inviteId: "",
      });
    } catch (err) {
      console.log(err);
    }
  }

  @test public "AdminUserBootstrap#handler()"() {
    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      const handler = adminUserBootstrap.handler();
      return assert.strictEqual(handler !== undefined, true);
    } catch (err) {
      console.log(err);
    }
  }
}
export default AdminUserBootstrapTest;
