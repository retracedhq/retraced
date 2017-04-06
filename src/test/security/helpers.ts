import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import { apiTokenFromAuthHeader } from "../../security/helpers";

@suite class SecurityHelpersTest {
    @test public "helpers.apiTokenFromAuthHeader(undefined)"() {
        expect(apiTokenFromAuthHeader)
        .to
        .throw("Missing Authorization header");
    }
    @test public "helpers.apiTokenFromAuthHeader(token=abcdef)"() {
        const token = apiTokenFromAuthHeader("token=abcdef");
        expect(token).to.equal("abcdef");
    }
}
