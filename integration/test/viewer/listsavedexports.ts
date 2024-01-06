import * as querystring from "querystring";
import "mocha";
import { retracedUp } from "../pkg/retracedUp";
import * as Env from "../env";
import axios from "axios";
import assert from "assert";

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const randomNumber2 = Math.floor(Math.random() * 99999) + 1;

describe("Viewer API", function () {
  describe("Given the Retraced API is up and running", function () {
    const groupID1 = "rtrcdqa" + randomNumber.toString();
    const groupID2 = "rtrcdqa" + randomNumber2.toString();
    const actorID = "qa@retraced.io";

    beforeEach(retracedUp(Env));

    context("And a call is made to create two viewer descriptions scoped to different groups", function () {
      let token1;
      let token2;

      beforeEach(async () => {
        const opts = {
          group_id: groupID1,
          actor_id: actorID,
        };
        const qs = querystring.stringify(opts);

        const resp1 = await axios.get(
          `${Env.Endpoint}/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`,
          {
            headers: {
              Authorization: `Token token=${Env.ApiKey}`,
            },
          }
        );
        assert(resp1);
        token1 = resp1.data.token;
      });

      beforeEach(async () => {
        const opts = {
          group_id: groupID2,
          actor_id: actorID,
        };
        const qs = querystring.stringify(opts);

        const resp2 = await axios.get(
          `${Env.Endpoint}/publisher/v1/project/${Env.ProjectID}/viewertoken?${qs}`,
          {
            headers: {
              Authorization: `Token token=${Env.ApiKey}`,
            },
          }
        );
        assert(resp2);
        token2 = resp2.data.token;
      });

      context("And the viewer descriptors are exchanged for sessions", function () {
        let viewerSession1;
        let viewerSession2;

        beforeEach(async () => {
          const resp3 = await axios.post(`${Env.Endpoint}/viewer/v1/viewersession`, { token: token1 });
          assert(resp3);
          assert.strictEqual(resp3.status, 200);
          viewerSession1 = resp3.data.token;
        });

        beforeEach(async () => {
          const resp4 = await axios.post(`${Env.Endpoint}/viewer/v1/viewersession`, { token: token2 });
          assert(resp4);
          assert.strictEqual(resp4.status, 200);
          viewerSession2 = resp4.data.token;
        });

        context("And the sessions are used to create SavedExports", function () {
          let savedExport1;
          let savedExport2;

          beforeEach(async function () {
            const resp5 = await axios.post(
              `${Env.Endpoint}/viewer/v1/project/${Env.ProjectID}/export`,
              {
                name: "Test Name",
                exportBody: "Export Test Body",
              },
              {
                headers: {
                  Authorization: viewerSession1,
                },
              }
            );
            assert(resp5);
            assert.strictEqual(resp5.status, 201);
            savedExport1 = resp5.data;
          });

          beforeEach(async function () {
            const resp6 = await axios.post(
              `${Env.Endpoint}/viewer/v1/project/${Env.ProjectID}/export`,
              {
                name: "Test Name",
                exportBody: "Export Test Body",
              },
              {
                headers: {
                  Authorization: viewerSession2,
                },
              }
            );
            assert(resp6);
            assert.strictEqual(resp6.status, 201);
            savedExport2 = resp6.data;
          });

          context("When the first session is used to list saved exports.", function () {
            let responseBody;

            beforeEach(async function () {
              const resp7 = await axios.get(`${Env.Endpoint}/viewer/v1/project/${Env.ProjectID}/exports`, {
                headers: {
                  Authorization: viewerSession1,
                },
              });
              assert(resp7);
              assert.strictEqual(resp7.status, 200);
              responseBody = resp7.data;
            });

            specify(
              "Then the response should contain the one saved export created by the session.",
              function () {
                assert.strictEqual(responseBody.length, 1);
                assert.strictEqual(responseBody[0].id, savedExport1.id);
              }
            );
          });
        });
      });
    });
  });
});
