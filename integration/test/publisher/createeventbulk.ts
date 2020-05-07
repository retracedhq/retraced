
import { expect } from "chai";
import * as Retraced from "retraced";
import { tv4 } from "tv4";
import "mocha";
import "chai-http";
import { CreateEventSchema, GraphQLQuery, search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";
import * as util from "util";
import * as chalk from "chalk";

// tslint:disable-next-line
const chai = require("chai"), chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * (99999)) + 1;
const currentTime = new Date().valueOf();
const now = new Date(currentTime);
const next = new Date(currentTime + 10000);
const later = new Date(currentTime + 20000);
now.setMilliseconds(0); // api only returns seconds preceision
next.setMilliseconds(0); // api only returns seconds preceision
later.setMilliseconds(0); // api only returns seconds preceision


describe("Bulk Create Events", function () {

    describe("Given the Retraced API is up and running", function () {
        let responseBody: any = {};
        let resultBody;
        beforeEach(retracedUp(Env));

        context("And a call is made into the Retraced API with a list of 3 audit events with different actors", () => {
            beforeEach(async function () {
                const retraced = new Retraced.Client({
                    apiKey: Env.ApiKey,
                    projectId: Env.ProjectID,
                    endpoint: Env.Endpoint,
                });

                const events = [
                    {
                        action: "integrationbulk" + randomNumber.toString(),
                        group: {
                            id: "rtrcdqa1234",
                            name: "RetracedQA",
                        },
                        created: now,
                        crud: "c",
                        sourceIp: "192.168.0.1",
                        actor: {
                            id: "NOW@retraced.io",
                            name: "RetracedQA Employee",
                        },
                    }, {
                        action: "integrationbulk" + randomNumber.toString(),
                        group: {
                            id: "rtrcdqa1234",
                            name: "RetracedQA",
                        },
                        created: next,
                        crud: "c",
                        sourceIp: "192.168.0.1",
                        actor: {
                            id: "NEXT@retraced.io",
                            name: "RetracedQA Employee number 2",
                        },
                    }, {
                        action: "integrationbulk" + randomNumber.toString(),
                        group: {
                            id: "rtrcdqa1234",
                            name: "RetracedQA",
                        },
                        created: later,
                        crud: "c",
                        sourceIp: "192.168.0.1",
                        actor: {
                            id: "LATER@retraced.io",
                            name: "RetracedQA Employee number 3",
                        },
                    },
                ];
                resultBody = await retraced.reportEvents(events);
            });

            context("When a call is made to the GraphQL endpoint for the event", function () {
                beforeEach(function (done) {
                    this.timeout(Env.EsIndexWaitMs * 2);
                    sleep(Env.EsIndexWaitMs).then(() => {
                        chai.request(Env.Endpoint)
                            .post("/publisher/v1/graphql")
                            .set("Authorization", "token=" + Env.ApiKey)
                            .send(search("integrationbulk" + randomNumber.toString()))
                            .end(function (err, res) {
                                responseBody = JSON.parse(res.text);
                                if (err && Env.Debug) {
                                    console.log(chalk.red(util.inspect(err.response.body, false, 100, false)));
                                } else if (Env.Debug) {
                                    console.log(util.inspect(res.body, false, 100, true));
                                }
                                expect(err).to.be.null;
                                expect(res).to.have.property("status", 200);

                                done();
                            });
                    });
                });
                specify("Then the response should contain all three events", function () {
                    expect(responseBody.data.search.edges.length).to.equal(3);
                    expect(responseBody).to.have.deep.property("data.search.edges[0].node.action", "integrationbulk" + randomNumber.toString());
                    expect(responseBody).to.have.deep.property("data.search.edges[0].node.created", isoDate(later));
                    expect(responseBody).to.have.deep.property("data.search.edges[0].node.group.id", "rtrcdqa1234");
                    expect(responseBody).to.have.deep.property("data.search.edges[0].node.crud", "c");
                    expect(responseBody).to.have.deep.property("data.search.edges[0].node.source_ip", "192.168.0.1");
                    expect(responseBody).to.have.deep.property("data.search.edges[0].node.actor.id", "LATER@retraced.io");

                    expect(responseBody).to.have.deep.property("data.search.edges[1].node.action", "integrationbulk" + randomNumber.toString());
                    expect(responseBody).to.have.deep.property("data.search.edges[1].node.created", isoDate(next));
                    expect(responseBody).to.have.deep.property("data.search.edges[1].node.group.id", "rtrcdqa1234");
                    expect(responseBody).to.have.deep.property("data.search.edges[1].node.crud", "c");
                    expect(responseBody).to.have.deep.property("data.search.edges[1].node.source_ip", "192.168.0.1");
                    expect(responseBody).to.have.deep.property("data.search.edges[1].node.actor.id", "NEXT@retraced.io");

                    expect(responseBody).to.have.deep.property("data.search.edges[2].node.action", "integrationbulk" + randomNumber.toString());
                    expect(responseBody).to.have.deep.property("data.search.edges[2].node.created", isoDate(now));
                    expect(responseBody).to.have.deep.property("data.search.edges[2].node.group.id", "rtrcdqa1234");
                    expect(responseBody).to.have.deep.property("data.search.edges[2].node.crud", "c");
                    expect(responseBody).to.have.deep.property("data.search.edges[2].node.source_ip", "192.168.0.1");
                    expect(responseBody).to.have.deep.property("data.search.edges[2].node.actor.id", "NOW@retraced.io");
                });
            });
        });
    });
});
