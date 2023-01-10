import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

import { AdminUserBootstrap } from "../../../handlers/admin/AdminUserBootstrap";

// const adminUserBootstrap = TypeMoq.Mock.ofType(AdminUserBootstrap);

@suite
class AdminUserBootstrapTest {
  @test
  public async "AdminUserBootstrap#AdminUserBootstrap() gets initialized"() {
    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      return expect(adminUserBootstrap).to.not.be.null;
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
      expect(err.err.message).to.equal(expected.message);
      expect(err.status).to.equal(404);
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
      expect(err.err.message).to.equal(expected.message);
      expect(err.status).to.equal(404);
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
      expect(err.err.message).to.equal(expected.message);
      expect(err.status).to.equal(400);
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

  @test public async "AdminUserBootstrap#handler()"() {
    try {
      const adminUserBootstrap = new AdminUserBootstrap("test");
      const handler = adminUserBootstrap.handler();
      return expect(handler).to.not.be.undefined;
    } catch (err) {
      console.log(err);
    }
  }
}
export default AdminUserBootstrapTest;
