import { expect } from "chai";
import * as Retraced from "@retraced-hq/retraced";
import { tv4 } from "tv4";
import "mocha";
import "chai-http";
import { CreateEventSchema } from "../pkg/specs";
import { retracedUp } from "../pkg/retracedUp";
import { sleep } from "../pkg/util";
import * as Env from "../env";
import * as _ from "lodash";

// tslint:disable-next-line
const chai = require("chai"),
  chaiHttp = require("chai-http");
chai.use(chaiHttp);

const randomNumber = Math.floor(Math.random() * 99999) + 1;
const currentTime = new Date();

describe("Publisher Search", function () {
  describe("Given the Retraced API is up and running", function () {
    const retraced = new Retraced.Client({
      apiKey: Env.ApiKey,
      projectId: Env.ProjectID,
      endpoint: Env.Endpoint,
    });
    const uniqueActorId = randomNumber.toString() + "@retraced.io";

    beforeEach(retracedUp(Env));

    describe(`And 10 events have been reported with actor ${uniqueActorId}`, function () {
      const created = Date.now();
      const events = _.map(_.range(10), (i) => ({
        action: "integration.test.api",
        group: {
          id: "rtrcdqa1234",
          name: "RetracedQA",
        },
        created: new Date(created + i),
        crud: "c",
        sourceIp: `192.168.0.${i}`,
        actor: {
          id: uniqueActorId,
          name: "RetracedQA Employee",
          href: "https://retraced.io/employees/qa",
          fields: {
            admin: "true",
          },
        },
        target: {
          id: "rtrcdapi",
          name: "Retraced API",
          href: "https://customertowne.xyz/records/rtrcdapi",
          type: "integration",
          fields: {
            priority: "100",
          },
        },
        description: "Automated integration testing...",
        isFailure: false,
        component: "chai",
        version: "v1",
        fields: {
          quality: "excellent",
        },
      }));

      before(() =>
        Promise.all(
          events.map((event) => {
            const valid = tv4.validate(event, CreateEventSchema);
            if (!valid) {
              console.log(tv4.error);
            }
            expect(valid).to.be.true;
            return retraced.reportEvent(event);
          })
        )
      );

      context(
        `When searching the publisher GraphQL endpoint for actor_id:${uniqueActorId} with pageSize 3 and fields "action" and "actor.id"`,
        function () {
          let connection: Retraced.EventsConnection;

          beforeEach(async function () {
            this.timeout(Env.EsIndexWaitMs * 3);
            await sleep(Env.EsIndexWaitMs * 2);

            const structuredQuery = {
              actor_id: uniqueActorId,
            };
            const mask = {
              action: true,
              actor: {
                id: true,
              },
            };
            connection = await retraced.query(structuredQuery, mask, 3);
          });

          specify(
            "Then the connection should contain the first 3 results and metadata about the full results.",
            function () {
              expect(connection.currentResults).to.deep.equal([
                {
                  action: "integration.test.api",
                  actor: { id: uniqueActorId },
                },
                {
                  action: "integration.test.api",
                  actor: { id: uniqueActorId },
                },
                {
                  action: "integration.test.api",
                  actor: { id: uniqueActorId },
                },
              ]);
              expect(connection.totalCount).to.equal(10);
              expect(connection.hasPreviousPage()).to.equal(false);
              expect(connection.totalPages()).to.equal(4);
              expect(connection.currentPageNumber).to.equal(1);
              expect(connection.hasNextPage()).to.equal(true);
            }
          );

          context(
            "When calling connection.nextPage() three times",
            function () {
              beforeEach(async function () {
                this.timeout(Env.EsIndexWaitMs * 3);
                await connection.nextPage();
                await connection.nextPage();
                await connection.nextPage();
              });

              specify(
                "Then the connection should contain the last result and metadata about the full results.",
                function () {
                  expect(connection.currentPageNumber).to.equal(4);
                  expect(connection.totalCount).to.equal(10);
                  expect(connection.hasNextPage()).to.equal(false);
                  expect(connection.hasPreviousPage()).to.equal(true);
                  expect(connection.totalPages()).to.equal(4);
                  expect(connection.currentResults).to.deep.equal([
                    {
                      action: "integration.test.api",
                      actor: { id: uniqueActorId },
                    },
                  ]);
                }
              );
            }
          );
        }
      );
    });
  });
});
