import { expect } from "chai";
import "chai-http";
import * as Chance from "chance";
import * as Env from "../env";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
const chance = new Chance();

// tslint:disable-next-line
const chai = require("chai"), chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin Get Project", function() {
    if (!Env.AdminRootToken) {
        return;
    }
    let jwt;
    let project;
    let env;
    let delReqId;

    // Retraced API is up
    describe("Given the Retraced API is up and running", function() {
        beforeEach(retracedUp(Env));

        // admin user
        context("And an admin user exists with a project pending deletion", function() {
            before(async function() {
                const admin: any = await adminUser(Env);
                jwt = admin.jwt;
                project = admin.project;
                env = project.environments[0];
            });

            // with a pending environment deletion
            before(function(done) {
                chai.request(Env.Endpoint)
                    .post(`/admin/v1/project/${project.id}/environment/${env.id}/deletion_request`)
                    .set("Authorization", jwt)
                    .send({
                        resourceId: env.id,
                        resourceKind: "environment",
                    })
                    .end((err, res) => {
                        expect(err).to.be.null;
                        delReqId = res.body.id;
                        done();
                    });
            });

            context("When a call is made to get the project by id", function() {
                let responseBody;

                before(function(done) {
                    chai.request(Env.Endpoint)
                        .get(`/admin/v1/project/${project.id}`)
                        .set("Authorization", jwt)
                        .end((err, res) => {
                            expect(err).to.be.null;
                            responseBody = res.body;
                            done();
                        });
                });

                specify("The response should include the environment with deletion statuses.", function() {
                    const delEnv = responseBody.project.environments.find(({ id }) => id === env.id);
                    expect(delEnv.deletionRequest.id).to.equal(delReqId);
                    expect(delEnv.deletionRequest.resourceKind).to.equal("environment");
                });
            });
        });
    });
});
