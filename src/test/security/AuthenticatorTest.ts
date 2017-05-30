
import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import * as TypeMoq from "typemoq";

import * as pg from "pg";
import Authenticator from "../../security/Authenticator";

@suite class AuthenticatorTest {
    @test public async "Authenticator#getProjectTokenOr401() with valid token"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);

        const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "some-token");
        const tokenRows = { rowCount: 1, rows: [{ id: "some-token", project_id: "a-project", environment_id: "an-environment" }] };

        pool.setup((x) => x.query("select * from token where token = $1", tokenIdArgMatcher))
            .returns((args) => Promise.resolve(tokenRows))
            .verifiable(TypeMoq.Times.once());

        const authenticator = new Authenticator(pool.object);

        const token = await authenticator.getProjectTokenOr401("token=some-token", "a-project");

        expect(token.project_id).to.equal("a-project");
        expect(token.environment_id).to.equal("an-environment");

    }
    @test public async "Authenticator#getProjectTokenOr401() with invalid token"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        // set up postgres pool
        const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "bad-token");
        const tokenRows = { rowCount: 1, rows: [] as any[] };
        pool.setup((x) => x.query("select * from token where token = $1", tokenIdArgMatcher))
            .returns((args) => Promise.resolve(tokenRows))
            .verifiable(TypeMoq.Times.once());

        const authenticator = new Authenticator(pool.object);

        const expected = { status: 401, err: new Error("Unauthorized")};

        try {
            await authenticator.getProjectTokenOr401("token=bad-token", "a-project");
            throw new Error(`Expected error ${expected} to be thrown`);
        } catch (err) {
            expect(err).to.deep.equal(expected);
        }
    }

    @test public async "Authenticator#getProjectTokenOr401() with wrong project"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        // set up postgres pool
        const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "bad-token");
        const tokenRows = { rowCount: 1, rows: [{ id: "some-token", project_id: "a-project", environment_id: "an-environment" }] };
        pool.setup((x) => x.query("select * from token where token = $1", tokenIdArgMatcher))
            .returns((args) => Promise.resolve(tokenRows))
            .verifiable(TypeMoq.Times.once());

        const authenticator = new Authenticator(pool.object);

        const expected = { status: 401, err: new Error("Unauthorized")};

        try {
            await authenticator.getProjectTokenOr401("token=bad-token", "another-project");
            throw new Error(`Expected error ${expected} to be thrown`);
        } catch (err) {
            expect(err).to.deep.equal(expected);
        }

    }
}
