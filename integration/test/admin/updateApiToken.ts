import { Client } from "@retracedhq/retraced";
import * as Env from "../env";
import Chance from "chance";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import { sleep } from "../pkg/util";
import assert from "assert";
import axios from "axios";

const chance = new Chance();

describe("Admin Update API tokens", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  const headless = new Client({
    apiKey: Env.HeadlessApiKey,
    projectId: Env.HeadlessProjectID,
    endpoint: Env.Endpoint,
  });
  let jwt;
  let adminId;
  let project;
  let token;

  context("Given the Retraced API is up and running", function () {
    before(retracedUp(Env));

    context("And an admin user is logged in", function () {
      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        adminId = admin.userId;
        project = admin.project;
        token = project.tokens[0];
      });

      context("When a token name is updated", function () {
        const newName = chance.string();

        before(async function () {
          const resp1 = await axios.put(
            `${Env.Endpoint}/admin/v1/project/${project.id}/token/${token.token}`,
            {
              name: newName,
            },
            {
              headers: {
                Authorization: jwt,
              },
            }
          );
          assert(resp1);
        });

        // There's no GET token endpoint, but it can be read as a
        // subresource on project
        specify("GET project will return the new name.", async function () {
          const resp2 = await axios.get(`${Env.Endpoint}/admin/v1/project/${project.id}`, {
            headers: {
              Authorization: jwt,
            },
          });
          assert(resp2);
          const updatedTkn = resp2.data.project.tokens.find((tkn) => tkn.token === token.token);
          assert.notStrictEqual(updatedTkn.name, token.name);
          assert.strictEqual(updatedTkn.name, newName);
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The change has been audited under the headless project.", async function () {
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

            assert.strictEqual(audited.action, "api_token.update");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
            assert.strictEqual(audited.target!.id, token.token);
            assert.deepStrictEqual(audited.fields, {
              name: newName,
            });
          });
        }
      });

      context("When a token is disabled", function () {
        before(async function () {
          const resp3 = await axios.put(
            `${Env.Endpoint}/admin/v1/project/${project.id}/token/${token.token}`,
            {
              disabled: true,
            },
            {
              headers: {
                Authorization: jwt,
              },
            }
          );
          assert(resp3);
        });

        specify("GET project will return the token's status as disabled.", async function () {
          const resp4 = await axios.get(`${Env.Endpoint}/admin/v1/project/${project.id}`, {
            headers: {
              Authorization: jwt,
            },
          });
          assert(resp4);
          const updatedTkn = resp4.data.project.tokens.find((tkn) => tkn.token === token.token);
          assert.strictEqual(updatedTkn.disabled, true);
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The change has been audited under the headless project.", async function () {
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

            assert.strictEqual(audited.action, "api_token.update");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
            assert.strictEqual(audited.target!.id, token.token);
            assert.deepStrictEqual(audited.fields, {
              disabled: "true",
            });
          });
        }
      });
    });
  });
});
