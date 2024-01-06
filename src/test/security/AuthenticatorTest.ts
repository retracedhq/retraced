import { suite, test } from "@testdeck/mocha";
import * as TypeMoq from "typemoq";

import pg from "pg";
import Authenticator from "../../security/Authenticator";
import { getApiTokenQuery } from "../../models/api_token/get";
import { QueryResult } from "pg";
import assert from "assert";

@suite
class AuthenticatorTest {
  @test public async "Authenticator#getApiTokenOr401() with valid token"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);

    const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "some-token");
    const tokenRows = {
      rowCount: 1,
      rows: [
        {
          token: "some-token",
          project_id: "a-project",
          environment_id: "an-environment",
        },
      ],
    };

    pool
      .setup((x) => x.query(getApiTokenQuery, tokenIdArgMatcher))
      .returns(() => Promise.resolve(tokenRows) as Promise<QueryResult>)
      .verifiable(TypeMoq.Times.once());

    const authenticator = new Authenticator(pool.object);

    const token = await authenticator.getApiTokenOr401("token=some-token", "a-project");

    assert.strictEqual(token.projectId, "a-project");
    assert.strictEqual(token.environmentId, "an-environment");
  }
  @test public async "Authenticator#getApiTokenOr401() with invalid token"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    // set up postgres pool
    const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "bad-token");
    const tokenRows = { rowCount: 0, rows: [] as any[] };
    pool
      .setup((x) => x.query(getApiTokenQuery, tokenIdArgMatcher))
      .returns(() => Promise.resolve(tokenRows) as Promise<QueryResult>)
      .verifiable(TypeMoq.Times.once());

    const authenticator = new Authenticator(pool.object);

    const expected = { status: 401, err: new Error("Unauthorized") };

    try {
      await authenticator.getApiTokenOr401("token=bad-token", "a-project");
      throw new Error(`Expected error ${JSON.stringify(expected)} to be thrown`);
    } catch (err) {
      assert.deepEqual(err.status, expected.status);
      assert.deepEqual(err.err.message, expected.err.message);
    }
  }

  @test public async "Authenticator#getApiTokenOr401() with wrong project"() {
    const pool = TypeMoq.Mock.ofType(pg.Pool);
    // set up postgres pool
    const tokenIdArgMatcher = TypeMoq.It.is((a: any) => a[0] === "bad-token");
    const tokenRows = {
      rowCount: 1,
      rows: [
        {
          token: "some-token",
          project_id: "a-project",
          environment_id: "an-environment",
        },
      ],
    };
    pool
      .setup((x) => x.query(getApiTokenQuery, tokenIdArgMatcher))
      .returns(() => Promise.resolve(tokenRows) as Promise<QueryResult>)
      .verifiable(TypeMoq.Times.once());

    const authenticator = new Authenticator(pool.object);

    const expected = { status: 401, err: new Error("Unauthorized") };

    try {
      await authenticator.getApiTokenOr401("token=bad-token", "another-project");
      throw new Error(`Expected error ${JSON.stringify(expected)} to be thrown`);
    } catch (err) {
      assert.deepEqual(err.status, expected.status);
      assert.deepEqual(err.err.message, expected.err.message);
    }
  }
}

export default AuthenticatorTest;
