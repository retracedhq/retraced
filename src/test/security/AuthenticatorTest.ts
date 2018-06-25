
import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import * as TypeMoq from "typemoq";

import * as pg from "pg";
import Authenticator from "../../security/Authenticator";
import { getApiTokenQuery } from "../../models/api_token/get";
import { QueryResult } from "pg";

@suite class AuthenticatorTest {
    @test public async "Authenticator#getApiTokenOr401() with valid token"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);

        const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "some-token");
        const tokenRows = { rowCount: 1, rows: [{ token: "some-token", project_id: "a-project", environment_id: "an-environment" }] };

        pool.setup((x) => x.query(getApiTokenQuery, tokenIdArgMatcher))
            .returns((args) => Promise.resolve(tokenRows) as Promise<QueryResult>)
            .verifiable(TypeMoq.Times.once());

        const authenticator = new Authenticator(pool.object);

        const token = await authenticator.getApiTokenOr401("token=some-token", "a-project");

        expect(token.projectId).to.equal("a-project");
        expect(token.environmentId).to.equal("an-environment");

    }
    @test public async "Authenticator#getApiTokenOr401() with invalid token"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        // set up postgres pool
        const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "bad-token");
        const tokenRows = { rowCount: 0, rows: [] as any[] };
        pool.setup((x) => x.query(getApiTokenQuery, tokenIdArgMatcher))
            .returns((args) => Promise.resolve(tokenRows) as Promise<QueryResult>)
            .verifiable(TypeMoq.Times.once());

        const authenticator = new Authenticator(pool.object);

        const expected = { status: 401, err: new Error("Unauthorized")};

        try {
            await authenticator.getApiTokenOr401("token=bad-token", "a-project");
            throw new Error(`Expected error ${expected} to be thrown`);
        } catch (err) {
            expect(err).to.deep.equal(expected);
        }
    }

    @test public async "Authenticator#getApiTokenOr401() with wrong project"() {
        const pool = TypeMoq.Mock.ofType(pg.Pool);
        // set up postgres pool
        const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "bad-token");
        const tokenRows = { rowCount: 1, rows: [{ token: "some-token", project_id: "a-project", environment_id: "an-environment" }] };
        pool.setup((x) => x.query(getApiTokenQuery, tokenIdArgMatcher))
            .returns((args) => Promise.resolve(tokenRows) as Promise<QueryResult>)
            .verifiable(TypeMoq.Times.once());

        const authenticator = new Authenticator(pool.object);

        const expected = { status: 401, err: new Error("Unauthorized")};

        try {
            await authenticator.getApiTokenOr401("token=bad-token", "another-project");
            throw new Error(`Expected error ${expected} to be thrown`);
        } catch (err) {
            expect(err).to.deep.equal(expected);
        }

    }
}
