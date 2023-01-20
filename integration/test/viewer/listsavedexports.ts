import * as querystring from "querystring";
import { expect } from "chai";
import "mocha";
import "chai-http";
import { retracedUp } from "../pkg/retracedUp";
import * as Env from "../env";

const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const randomNumber2 = Math.floor(Math.random() * 99999) + 1;

describe("Viewer API", function () {
  describe("Given the Retraced API is up and running", function () {
    const groupID1 = "rtrcdqa" + randomNumber.toString();
    const groupID2 = "rtrcdqa" + randomNumber2.toString();
    const actorID = "qa@retraced.io";

    let resultBody;
    beforeEach(retracedUp(Env));

    context(
      "And a call is made to create two viewer descriptions scoped to different groups",
      function () {
        let token1;
        let token2;

        beforeEach((done) => {
          const opts = {
            group_id: groupID1,
            actor_id: actorID,
          };
          const qs = querystring.stringify(opts);

          chai
            .request(Env.Endpoint)
            .get(`/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`)
            .set("Authorization", `Token token=${Env.ApiKey}`)
            .end((err, res) => {
              expect(err).to.be.null;
              token1 = res.body.token;
              done();
            });
        });

        beforeEach((done) => {
          const opts = {
            group_id: groupID2,
            actor_id: actorID,
          };
          const qs = querystring.stringify(opts);

          chai
            .request(Env.Endpoint)
            .get(`/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`)
            .set("Authorization", `Token token=${Env.ApiKey}`)
            .end((err, res) => {
              expect(err).to.be.null;
              token2 = res.body.token;
              done();
            });
        });

        context(
          "And the viewer descriptors are exchanged for sessions",
          function () {
            let viewerSession1;
            let viewerSession2;

            beforeEach((done) => {
              chai
                .request(Env.Endpoint)
                .post("/viewer/v1/viewersession")
                .send({ token: token1 })
                .end(function (err, res) {
                  viewerSession1 = JSON.parse(res.text).token;
                  expect(err).to.be.null;
                  expect(res).to.have.property("status", 200);
                  done();
                });
            });

            beforeEach((done) => {
              chai
                .request(Env.Endpoint)
                .post("/viewer/v1/viewersession")
                .send({ token: token2 })
                .end(function (err, res) {
                  viewerSession2 = JSON.parse(res.text).token;
                  expect(err).to.be.null;
                  expect(res).to.have.property("status", 200);
                  done();
                });
            });

            context(
              "And the sessions are used to create SavedExports",
              function () {
                let savedExport1;
                let savedExport2;

                beforeEach(function (done) {
                  chai
                    .request(Env.Endpoint)
                    .post(`/viewer/v1/project/${Env.ProjectID}/export`)
                    .set("Authorization", viewerSession1)
                    .send({
                      name: "Test Name",
                      exportBody: "Export Test Body",
                    })
                    .end((err, res) => {
                      expect(err).to.be.null;
                      expect(res).to.have.property("status", 201);
                      savedExport1 = JSON.parse(res.text);
                      done();
                    });
                });

                beforeEach(function (done) {
                  chai
                    .request(Env.Endpoint)
                    .post(`/viewer/v1/project/${Env.ProjectID}/export`)
                    .set("Authorization", viewerSession2)
                    .send({
                      name: "Test Name",
                      exportBody: "Export Test Body",
                    })
                    .end((err, res) => {
                      expect(err).to.be.null;
                      expect(res).to.have.property("status", 201);
                      savedExport2 = JSON.parse(res.text);
                      done();
                    });
                });

                context(
                  "When the first session is used to list saved exports.",
                  function () {
                    let responseBody;

                    beforeEach(function (done) {
                      chai
                        .request(Env.Endpoint)
                        .get(`/viewer/v1/project/${Env.ProjectID}/exports`)
                        .set("Authorization", viewerSession1)
                        .end((err, res) => {
                          expect(err).to.be.null;
                          expect(res).to.have.property("status", 200);
                          responseBody = JSON.parse(res.text);
                          done();
                        });
                    });

                    specify(
                      "Then the response should contain the one saved export created by the session.",
                      function () {
                        expect(responseBody).to.have.length(1);
                        expect(responseBody[0]).to.have.property(
                          "id",
                          savedExport1.id
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});
