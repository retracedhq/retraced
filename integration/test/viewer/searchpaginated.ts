import * as querystring from "querystring";
import { Client, CRUD } from "@retracedhq/retraced";
import tv4 from "tv4";
import "mocha";
import { CreateEventSchema, searchPaginated } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep, isoDate } from "../pkg/util";
import * as Env from "../env";
import assert from "assert";
import axios from "axios";

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();
currentTime.setMilliseconds(0); // api only returns seconds precision

describe("Viewer Paginated API", function () {
  describe("Given the Retraced API is up and running", function () {
    const groupID = "rtrccdqa" + randomNumber.toString();
    const targetID = "rtrccdapi";
    const actorID = "qa@retraced.io";

    beforeEach(retracedUp(Env));

    context("And a call is made into the Retraced API with a standard audit event", function () {
      beforeEach(async function () {
        await createEvent({
          action: "integration.test.api." + randomNumber.toString(),
          group: {
            id: groupID,
            name: "RetracedQA",
          },
          created: currentTime,
          crud: "c" as CRUD,
          source_ip: "192.168.0.1",
          actor: {
            id: actorID,
            name: "RetracedQA Employee",
            href: "https://retraced.io/employees/qa",
            fields: {
              department: "QA",
            },
          },
          target: {
            id: targetID,
            name: "Retraced API",
            href: "https://customertowne.xyz/records/rtrccdapi",
            type: "integration",
            fields: {
              record_count: "100",
            },
          },
          description: "Automated integration testing...",
          is_failure: false,
          fields: {
            quality: "excellent",
          },
        });
      });

      context("And a call is made to create a viewer description scoped to a target", function () {
        let token;

        beforeEach(async () => {
          const opts = {
            actor_id: actorID,
            group_id: groupID,
            isAdmin: true,
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
          token = resp1.data.token;
        });

        context("And the viewer descriptor is exchanged for a session", function () {
          let viewerSession;
          beforeEach(async () => {
            const resp2 = await axios.post(`${Env.Endpoint}/viewer/v1/viewersession`, { token });
            assert(resp2);
            assert.strictEqual(resp2.status, 200);
            viewerSession = resp2.data.token;
          });

          context("When a call is made to the Viewer API GraphQL endpoint for the event", function () {
            let responseBody;
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp3 = await axios.post(
                `${Env.Endpoint}/viewer/v1/graphql/paginated`,
                searchPaginated("integration.test.api." + randomNumber.toString()),
                {
                  headers: {
                    Authorization: viewerSession,
                  },
                }
              );
              assert(resp3);
              assert.strictEqual(resp3.status, 200);
              responseBody = resp3.data;
            });
            specify("Then the response should contain the correct information about the event", function () {
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.action,
                "integration.test.api." + randomNumber.toString()
              );
            });
          });
        });
      });

      context("And a call is made to create a viewer descriptor", function () {
        let token;
        beforeEach(async () => {
          const retraced = new Client({
            apiKey: Env.ApiKey,
            projectId: Env.ProjectID,
            endpoint: Env.Endpoint,
          });

          token = await retraced.getViewerToken(
            "rtrccdqa" + randomNumber.toString(),
            "qa@retraced.io",
            false
          );
        });

        context("And the viewer descriptor is exchanged for a session", function () {
          let viewerSession;
          let startCursor;
          beforeEach(async () => {
            const resp4 = await axios.post(`${Env.Endpoint}/viewer/v1/viewersession`, { token });
            assert(resp4);
            assert.strictEqual(resp4.status, 200);
            viewerSession = resp4.data.token;
          });

          context("When a call is made to the Viewer API GraphQL endpoint for the event", function () {
            let responseBody;
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp5 = await axios.post(
                `${Env.Endpoint}/viewer/v1/graphql/paginated`,
                searchPaginated("integration.test.api." + randomNumber.toString()),
                {
                  headers: {
                    Authorization: viewerSession,
                  },
                }
              );
              assert(resp5);
              assert.strictEqual(resp5.status, 200);
              responseBody = resp5.data;
            });
            specify("Then the response should contain the correct information about the event", function () {
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.action,
                "integration.test.api." + randomNumber.toString()
              );
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.created,
                isoDate(currentTime)
              );
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.description,
                "Automated integration testing..."
              );
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.group.id,
                "rtrccdqa" + randomNumber.toString()
              );
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.actor.fields[0].key,
                "department"
              );
              assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.actor.fields[0].value, "QA");
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.target.fields[0].key,
                "record_count"
              );
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.target.fields[0].value,
                "100"
              );
              assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.fields[0].key, "quality");
              assert.strictEqual(
                responseBody.data.searchPaginated.edges[0].node.fields[0].value,
                "excellent"
              );
              assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.target.name, "Retraced API");
              assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.is_failure, false);
              assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.crud, "c");
              assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.source_ip, "192.168.0.1");
            });
          });
          context("When a second call is made to the Viewer API GraphQL endpoint", function () {
            let responseBody;
            beforeEach(async function () {
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp6 = await axios.post(
                `${Env.Endpoint}/viewer/v1/graphql/paginated`,
                searchPaginated("audit.log.view"),
                {
                  headers: {
                    Authorization: viewerSession,
                  },
                }
              );
              assert(resp6);
              assert.strictEqual(resp6.status, 200);
              responseBody = resp6.data;
            });
            specify(
              "Then the most recent event should be an audit.log.view event with the actor specified",
              function () {
                assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.action, "audit.log.view");
                assert.strictEqual(
                  responseBody.data.searchPaginated.edges[0].node.group.id,
                  "rtrccdqa" + randomNumber.toString()
                );
                assert.strictEqual(responseBody.data.searchPaginated.edges[0].node.crud, "r");
                assert.strictEqual(
                  responseBody.data.searchPaginated.edges[0].node.actor.id,
                  "qa@retraced.io"
                );
                assert.strictEqual(
                  responseBody.data.searchPaginated.edges[0].node.actor.name,
                  "RetracedQA Employee"
                );
                assert.strictEqual(
                  responseBody.data.searchPaginated.edges[0].node.actor.fields[0].key,
                  "department"
                );
                assert.strictEqual(
                  responseBody.data.searchPaginated.edges[0].node.actor.fields[0].value,
                  "QA"
                );
              }
            );
          });
          context("When fetched first page with asc", function () {
            let firstPage;
            let date = new Date();
            date = new Date(date.setMinutes(date.getMinutes() - 15));
            beforeEach(async function () {
              for (let i = 1; i <= 15; i++) {
                await createEvent({
                  action: "integration.test.api." + randomNumber.toString() + "-1",
                  group: {
                    id: groupID,
                    name: "RetracedQA",
                  },
                  created: date,
                  crud: "c" as CRUD,
                  source_ip: "192.168.0.1",
                  actor: {
                    id: actorID,
                    name: "RetracedQA Employee",
                    href: "https://retraced.io/employees/qa",
                    fields: {
                      department: "QA",
                    },
                  },
                  target: {
                    id: targetID,
                    name: "Retraced API",
                    href: "https://customertowne.xyz/records/rtrccdapi",
                    type: "integration",
                    fields: {
                      record_id: `${i}`,
                    },
                  },
                  description: "Automated integration testing...",
                  is_failure: false,
                  fields: {
                    quality: "excellent",
                  },
                });
                date = new Date(date.setSeconds(date.getSeconds() + 60));
                await sleep(100);
              }
              this.timeout(Env.EsIndexWaitMs * 2);
              await sleep(Env.EsIndexWaitMs);

              const resp6 = await getPaginatedEvents(
                viewerSession,
                `action:"integration.test.api.${randomNumber.toString()}-1"  crud:c,u,d`,
                "asc",
                10,
                0
              );
              firstPage = resp6.data;
              startCursor = firstPage.data.searchPaginated.edges[0].cursor;
            });
            specify(
              "First page should have correct number of events & total count should be correct",
              function () {
                assert.strictEqual(firstPage.data.searchPaginated.edges.length, 10);
                assert.strictEqual(firstPage.data.searchPaginated.totalCount, 15);
              }
            );
          });
          context("When fetched the last page with asc", function () {
            let responseBody;
            let count = 10;
            beforeEach(async function () {
              const resp6 = await getPaginatedEvents(
                viewerSession,
                "integration.test.api." + randomNumber.toString() + "-1",
                "asc",
                count,
                count
              );
              responseBody = resp6.data;
            });
            specify("It should return the correct number of events", function () {
              assert.strictEqual(responseBody.data.searchPaginated.edges.length, 5);
              assert.strictEqual(responseBody.data.searchPaginated.totalCount, 15);
            });
          });
          context("When fetched the last page with cursor with asc", function () {
            let responseBody;
            let count = 10;
            beforeEach(async function () {
              const resp6 = await getPaginatedEvents(
                viewerSession,
                "integration.test.api." + randomNumber.toString() + "-1",
                "asc",
                count,
                count,
                startCursor
              );
              responseBody = resp6.data;
            });
            specify("It should return the correct number of events & total count", function () {
              assert.strictEqual(responseBody.data.searchPaginated.edges.length, 5);
              assert.strictEqual(responseBody.data.searchPaginated.totalCount, 15);
            });
          });
          context("When fetched first page with desc", function () {
            let responseBody;
            beforeEach(async function () {
              const resp6 = await getPaginatedEvents(
                viewerSession,
                `action:"integration.test.api.${randomNumber.toString()}-1"  crud:c,u,d`,
                "desc",
                10,
                0
              );
              responseBody = resp6.data;
              startCursor = responseBody.data.searchPaginated.edges[0].cursor;
            });
            specify("It should return the correct event counts", function () {
              assert.strictEqual(responseBody.data.searchPaginated.edges.length, 10);
              assert.strictEqual(responseBody.data.searchPaginated.totalCount, 15);
            });
          });
          context("When fetched first page with desc", function () {
            let responseBody;
            let count = 10;
            beforeEach(async function () {
              const resp6 = await getPaginatedEvents(
                viewerSession,
                `action:"integration.test.api.${randomNumber.toString()}-1"  crud:c,u,d`,
                "desc",
                count,
                0
              );
              responseBody = resp6.data;
            });
            specify("It should return the correct events", function () {
              assert.strictEqual(responseBody.data.searchPaginated.edges.length, 10);
              assert.strictEqual(responseBody.data.searchPaginated.totalCount, 15);
            });
          });
          context("When fetched the last page with desc", function () {
            let responseBody;
            let count = 10;
            beforeEach(async function () {
              const resp6 = await getPaginatedEvents(
                viewerSession,
                "integration.test.api." + randomNumber.toString() + "-1",
                "desc",
                count,
                count
              );
              responseBody = resp6.data;
            });
            specify("It should return the correct number of events", function () {
              assert.strictEqual(responseBody.data.searchPaginated.edges.length, 5);
              assert.strictEqual(responseBody.data.searchPaginated.totalCount, 15);
            });
          });
          context("When fetched the last page with cursor with desc", function () {
            let responseBody;
            let count = 10;
            beforeEach(async function () {
              const resp6 = await getPaginatedEvents(
                viewerSession,
                "integration.test.api." + randomNumber.toString() + "-1",
                "desc",
                count,
                count,
                startCursor
              );
              responseBody = resp6.data;
            });
            specify("It should return the correct number of events & total count", function () {
              assert.strictEqual(responseBody.data.searchPaginated.edges.length, 5);
              assert.strictEqual(responseBody.data.searchPaginated.totalCount, 15);
            });
          });
        });
      });
    });
  });
});

async function getPaginatedEvents(
  viewerSession: any,
  query: string,
  sortOrder: "asc" | "desc",
  pageOffset: number,
  pageLimit: number,
  startCursor: string = ""
) {
  const resp6 = await axios.post(
    `${Env.Endpoint}/viewer/v1/graphql/paginated`,
    searchPaginated(query, sortOrder, pageOffset, pageLimit, startCursor),
    {
      headers: {
        Authorization: viewerSession,
      },
    }
  );
  assert(resp6);
  assert.strictEqual(resp6.status, 200);
  return resp6;
}

async function createEvent(event: any) {
  const retraced = new Client({
    apiKey: Env.ApiKey,
    projectId: Env.ProjectID,
    endpoint: Env.Endpoint,
  });
  const valid = tv4.validate(event, CreateEventSchema);
  if (!valid) {
    console.log(tv4.error);
  }
  assert.strictEqual(valid, true);
  await retraced.reportEvent(event);
}
