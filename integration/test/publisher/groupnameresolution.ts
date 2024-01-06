import { Event, Client } from "@retracedhq/retraced";
import "mocha";
import { search } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep } from "../pkg/util";
import * as Env from "../env";
import assert from "assert";
import axios from "axios";

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const FIRST_EVENT = randomNumber.toString();
const SECOND_EVENT = (randomNumber + 1).toString();
const GROUP_ID = (randomNumber + 2).toString();
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Group Name Resolution", function () {
  describe("Given the Retraced API is up and running", function () {
    let responseBody: any = {};
    beforeEach(retracedUp(Env));

    context("And a call is made into the Retraced API with only a group.id", () => {
      beforeEach(async function () {
        const retraced = new Client({
          apiKey: Env.ApiKey,
          projectId: Env.ProjectID,
          endpoint: Env.Endpoint,
        });

        const event: Event = {
          action: "integration" + FIRST_EVENT,
          group: {
            id: "rtrcdqa1234" + GROUP_ID,
          },
          is_anonymous: true,
          crud: "r",
        };
        await retraced.reportEvent(event);
      });
      context(
        "And another call is made into the Retraced API with the same group.id and a group.name",
        () => {
          beforeEach(function (done) {
            const retraced = new Client({
              apiKey: Env.ApiKey,
              projectId: Env.ProjectID,
              endpoint: Env.Endpoint,
            });

            const event: Event = {
              action: "integration" + SECOND_EVENT,
              group: {
                id: "rtrcdqa1234" + GROUP_ID,
                name: "group number " + GROUP_ID,
              },
              is_anonymous: true,
              crud: "r",
            };
            retraced.reportEvent(event).then((id) => done());
          });

          context("When a call is made to the GraphQL endpoint for the first event", function () {
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp1 = await axios.post(
                `${Env.Endpoint}/publisher/v1/graphql`,
                search("integration" + FIRST_EVENT),
                {
                  headers: {
                    Authorization: "token=" + Env.ApiKey,
                  },
                }
              );
              assert(resp1);
              assert.strictEqual(resp1.status, 200);
              responseBody = resp1.data;
            });
            specify(
              "Then the response should contain a non-null group.id, and the second event's group.name should be populated",
              function () {
                assert.strictEqual(
                  responseBody.data.search.edges[0].node.action,
                  "integration" + FIRST_EVENT
                );
                assert.strictEqual(responseBody.data.search.edges[0].node.group.id, "rtrcdqa1234" + GROUP_ID);
                assert.strictEqual(
                  responseBody.data.search.edges[0].node.group.name,
                  "group number " + GROUP_ID
                );
              }
            );
          });

          context("When a call is made to the GraphQL endpoint for the second event", function () {
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp2 = await axios.post(
                `${Env.Endpoint}/publisher/v1/graphql`,
                search("integration" + SECOND_EVENT),
                {
                  headers: {
                    Authorization: "token=" + Env.ApiKey,
                  },
                }
              );
              assert(resp2);
              assert.strictEqual(resp2.status, 200);
              responseBody = resp2.data;
            });
            specify(
              "Then the response should contain a non-null group.id, and the second event's group.name should be populated",
              function () {
                assert.strictEqual(
                  responseBody.data.search.edges[0].node.action,
                  "integration" + SECOND_EVENT
                );
                assert.strictEqual(responseBody.data.search.edges[0].node.group.id, "rtrcdqa1234" + GROUP_ID);
                assert.strictEqual(
                  responseBody.data.search.edges[0].node.group.name,
                  "group number " + GROUP_ID
                );
              }
            );
          });
        }
      );
    });
  });
});
