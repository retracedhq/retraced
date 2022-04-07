import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import handler from "../../handlers/createAdminSession";

@suite class CreateAdminSessionTest {
    @test public async "CreateAdminSession#handler() throws if external_auth is not present in boby"() {
        let req = {
            body: {},
        };
        const expected = new Error("Missing required auth");

        try {
            await handler(req);
            throw new Error(`Expected error ${expected} to be thrown`);
        } catch (err) {
            expect(err.err.message).to.equal(expected.message);
            expect(err.status).to.equal(400);
        }
    }

    @test public async "CreateAdminSession#handler() throws if auth0 is not initialised"() {
        let req = {
            body: {
                external_auth: "",
            },
        };
        const expected = new Error("Missing required auth");

        try {
            await handler(req);
            throw new Error(`Expected error ${expected} to be thrown`);
        } catch (err) {
            expect(err.err.message).to.equal(expected.message);
            expect(err.status).to.equal(400);
        }
    }
}
