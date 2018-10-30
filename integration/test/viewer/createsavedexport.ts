import * as querystring from "querystring";
import { expect } from "chai";
import * as Retraced from "retraced";
import "mocha";
import "chai-http";
import { retracedUp } from "../pkg/retracedUp";
import * as Env from "../env";

// tslint:disable-next-line
const chai = require("chai"), chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * (99999)) + 1;

describe("Viewer API", function () {

    describe("Given the Retraced API is up and running", function () {
        const groupID = "rtrcdqa" + randomNumber.toString();
        const actorID = "qa@retraced.io";

        let resultBody;
        beforeEach(retracedUp(Env));

        context("And a call is made to create a viewer description scoped to a group", function() {
            let token;

            beforeEach((done) => {
                const opts = {
                  group_id: groupID,
                // TODO why is actorID required?
                  actor_id: actorID,
                };
                const qs = querystring.stringify(opts);

                chai.request(Env.Endpoint)
                    .get(`/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`)
                    .set("Authorization", `Token token=${Env.ApiKey}`)
                    .end((err, res) => {
                        expect(err).to.be.null;
                        token = res.body.token;
                        done();
                    });
            });

            context("And the viewer descriptor is exchanged for a session", function () {
                let viewerSession;
                beforeEach((done) => {
                    chai.request(Env.Endpoint)
                        .post("/viewer/v1/viewersession")
                        .send({ token })
                        .end(function (err, res) {
                            viewerSession = JSON.parse(res.text).token;
                            expect(err).to.be.null;
                            expect(res).to.have.status(200);
                            done();
                        });
                });

                context("When a call is made to the Viewer API create saved export endpoint", function() {
                    let responseBody;

                    beforeEach(function (done) {
                        chai.request(Env.Endpoint)
                            .post(`/viewer/v1/project/${Env.ProjectID}/export`)
                            .set("Authorization", viewerSession)
                            .send({
                                name: "Test Name",
                                exportBody: "Export Test Body",
                            })
                            .end((err, res) => {
                                responseBody = JSON.parse(res.text);
                                expect(err).to.be.null;
                                expect(res).to.have.status(201);
                                done();
                            });
                    });

                    specify("Then the response should contain the new saved export.", function() {
                        expect(responseBody.id).to.be.ok;
                    });
                });
            });
        });
    });
});
