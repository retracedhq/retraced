import { expect } from "chai";
import "chai-http";
import * as Retraced from "retraced";
import * as Env from "../env";
import * as Chance from "chance";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import { sleep } from "../pkg/util";

const chance = new Chance();

// tslint:disable-next-line
const chai = require("chai"), chaiHttp = require("chai-http");
chai.use(chaiHttp);

describe("Admin Update API tokens", function() {
    if (!Env.AdminRootToken) {
        return;
    }
    const headless = new Retraced.Client({
        apiKey: Env.HeadlessApiKey,
        projectId: Env.HeadlessProjectID,
        endpoint: Env.Endpoint,
    });
    let jwt;
    let adminId;
    let project;
    let token;

    context("Given the Retraced API is up and running", function() {
        before(retracedUp(Env));

        context("And an admin user is logged in", function() {
            before(async function() {
                const admin: any = await adminUser(Env);
                jwt = admin.jwt;
                adminId = admin.userId;
                project = admin.project;
                token = project.tokens[0];
            });

            context("When a token name is updated", function() {
                const newName = chance.string();

                before(function(done) {
                    chai.request(Env.Endpoint)
                        .put(`/admin/v1/project/${project.id}/token/${token.token}`)
                        .set("Authorization", jwt)
                        .send({
                            name: newName,
                        })
                        .end((err, res) => {
                            expect(err).to.be.null;
                            done();
                        });
                });

                // There's no GET token endpoint, but it can be read as a
                // subresource on project
                specify("GET project will return the new name.", function(done) {
                    chai.request(Env.Endpoint)
                        .get(`/admin/v1/project/${project.id}`)
                        .set("Authorization", jwt)
                        .end((err, res) => {
                            const updatedTkn = res.body.project.tokens.find(
                                (tkn) => tkn.token === token.token
                            );
                            expect(updatedTkn.name).not.to.equal(token.name);
                            expect(updatedTkn.name).to.equal(newName);
                            done();
                        });
                });

                specify("The change has been audited under the headless project.", async function() {
                    this.timeout(Env.EsIndexWaitMs * 2);
                    await sleep(Env.EsIndexWaitMs);
                    const query = {
                        crud: "u",
                        action: "api_token.update",
                    };
                    const mask = {
                        action: true,
                        crud: true,
                        actor: {
                            id: true,
                        },
                        target: {
                            id: true,
                        },
                        group: {
                            id: true,
                        },
                        fields: true,
                    };
                    const connection = await headless.query(query, mask, 1);
                    const audited = connection.currentResults[0];

                    expect(audited.action).to.equal("api_token.update");
                    expect(audited.group!.id).to.equal(project.id);
                    expect(audited.actor!.id).to.equal(adminId);
                    expect(audited.target!.id).to.equal(token.token);
                    expect(audited.fields).to.deep.equal({
                        name: newName,
                    });
                });
            });

            context("When a token is disabled", function() {
                before(function(done) {
                    chai.request(Env.Endpoint)
                        .put(`/admin/v1/project/${project.id}/token/${token.token}`)
                        .set("Authorization", jwt)
                        .send({
                            disabled: true,
                        })
                        .end((err, res) => {
                            expect(err).to.be.null;
                            done();
                        });
                });

                specify("GET project will return the token's status as disabled.", function(done) {
                    chai.request(Env.Endpoint)
                        .get(`/admin/v1/project/${project.id}`)
                        .set("Authorization", jwt)
                        .end((err, res) => {
                            const updatedTkn = res.body.project.tokens.find(
                                (tkn) => tkn.token === token.token
                            );
                            expect(updatedTkn.disabled).to.equal(true);
                            done();
                        });
                });

                specify("The change has been audited under the headless project.", async function() {
                    this.timeout(Env.EsIndexWaitMs * 2);
                    await sleep(Env.EsIndexWaitMs);
                    const query = {
                        crud: "u",
                        action: "api_token.update",
                    };
                    const mask = {
                        action: true,
                        crud: true,
                        actor: {
                            id: true,
                        },
                        target: {
                            id: true,
                        },
                        group: {
                            id: true,
                        },
                        fields: true,
                    };
                    const connection = await headless.query(query, mask, 1);
                    const audited = connection.currentResults[0];

                    expect(audited.action).to.equal("api_token.update");
                    expect(audited.group!.id).to.equal(project.id);
                    expect(audited.actor!.id).to.equal(adminId);
                    expect(audited.target!.id).to.equal(token.token);
                    expect(audited.fields).to.deep.equal({
                        disabled: "true",
                    });
                });
            });
        });
    });
});
