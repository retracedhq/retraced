import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import {
    apiTokenFromAuthHeader,
    checkAdminAccessUnwrapped,
} from "../../security/helpers";

@suite class SecurityHelpersTest {
    @test public "helpers.apiTokenFromAuthHeader(undefined)"() {
        expect(apiTokenFromAuthHeader)
        .to
        .throw({ status: 401, err: new Error("Missing Authorization header")} as any);
    }
    @test public "helpers.apiTokenFromAuthHeader(token=abcdef)"() {
        const token = apiTokenFromAuthHeader("token=abcdef");
        expect(token).to.equal("abcdef");
    }
    @test public async "helpers.checkAdminAccessUnwrapped(undefined)"() {
      await checkAdminAccessUnwrapped(undefined as any)
        .then(() => { throw new Error("Error not thrown"); })
        .catch((err) => {
          expect(err)
            .to
            .deep.equal({ status: 401, err: new Error("Missing Authorization header")});
        });
    }
}

export default SecurityHelpersTest;
