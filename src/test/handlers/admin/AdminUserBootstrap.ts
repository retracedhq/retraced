import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import { AdminUserBootstrap } from "../../../handlers/admin/AdminUserBootstrap";

// const adminUserBootstrap = TypeMoq.Mock.ofType(AdminUserBootstrap);

@suite class AdminUserBootstrapTest {
    @test public async "AdminUserBootstrap#AdminUserBootstrap() gets initialized"() {
        try {
            let adminUserBootstrap = new AdminUserBootstrap("test");
            expect(adminUserBootstrap).to.not.be.null;
        } catch (err) {
            console.log(err);
        }
    }

    @test public async "AdminUserBootstrap#handle() throws if token is not found"() {
        const expected = new Error("Not Found");

        try {
            let adminUserBootstrap = new AdminUserBootstrap("test");
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

    @test public async "AdminUserBootstrap#handle() throws if token is not valid"() {
        const expected = new Error("Not Found");

        try {
            let adminUserBootstrap = new AdminUserBootstrap("test");
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

    @test public async "AdminUserBootstrap#handle() throws if claims has not valid email"() {
        const expected = new Error("Missing or invalid parameter: `claims.email`");

        try {
            let adminUserBootstrap = new AdminUserBootstrap("test");
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
            let adminUserBootstrap = new AdminUserBootstrap("test");
            let res = await adminUserBootstrap.handle("token=test", {
                email: "test@test.com",
                upstreamToken: "",
                inviteId: "",
            });
            console.log(res);
        } catch (err) {
            console.log(err);
        }
    }

    @test public async "AdminUserBootstrap#handler()"() {
        try {
            let adminUserBootstrap = new AdminUserBootstrap("test");
            let handler = adminUserBootstrap.handler();
            expect(handler).to.not.be.undefined;
        } catch (err) {
            console.log(err);
        }
    }
}
