import { suite, test } from "mocha-typescript";
import { expect } from "chai";

import * as util from "util";
import { ApiSpec, removeRoutesNotMatching, filterAndAssign } from "../swagger";

@suite class SwaggerTest {
    @test public "swagger.removeRoutesNotMatching"() {
        const swagger = {
            paths: {
                "/publisher/v1/project/{projectId}/event": {
                    stuff: "k",
                },
                "/admin/v1/project/{projectId}/apitoken": {
                    stuff: "nah",
                },
            },
        };

        removeRoutesNotMatching(swagger, /^\/publisher\/v1/);

        expect(swagger.paths["/admin/v1/project/{projectId}/apitoken"]).not.to.exist;
        expect(swagger.paths["/publisher/v1/project/{projectId}/event"]).to.exist;
    }

    @test public "swagger.filterAndAssign"() {
        const swagger = {
            paths: {
                "/publisher/v1/project/{projectId}/event": {
                    stuff: "k",
                },
                "/admin/v1/project/{projectId}/apitoken": {
                    stuff: "nah",
                },
            },
        };

        const specs: ApiSpec[] = [
            {
                match: /^\/publisher\/v1/,
                path: "/publisher/v1",
                title: "Publisher API",
                description: "APIs for vendor integration with the Retraced Platform",
            },
            {
                match: /^\/admin\/v1/,
                path: "/admin/v1",
                title: "Admin API",
                description: "APIs used by the Retraced Admin web UI",
            },
        ];

        filterAndAssign(swagger, specs);

        // tslint:disable:unused-expression
        expect(specs[0].swagger.paths["/publisher/v1/project/{projectId}/event"]).to.exist;
        expect(specs[0].swagger.paths["/admin/v1/project/{projectId}/apitoken"]).not.to.exist;
        expect(specs[0].swagger.info.description).to.equal(specs[0].description);
        expect(specs[0].swagger.info.title).to.equal(specs[0].title);

        expect(specs[1].swagger.paths["/publisher/v1/project/{projectId}/event"]).not.to.exist;
        expect(specs[1].swagger.paths["/admin/v1/project/{projectId}/apitoken"]).to.exist;
        expect(specs[1].swagger.info.description).to.equal(specs[1].description);
        expect(specs[1].swagger.info.title).to.equal(specs[1].title);
        // tslint:enable:unused-expression

    }
}
