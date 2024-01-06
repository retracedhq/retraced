import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";
import axios from "axios";

describe("Admin list invites", function () {
  if (!Env.AdminRootToken) {
    return;
  }
  const headless = new Client({
    apiKey: Env.HeadlessApiKey,
    projectId: Env.HeadlessProjectID,
    endpoint: Env.Endpoint,
  });
  let project;
  let env;
  let jwt;
  let adminId;

  context("Given the Retraced API is up and running", function () {
    before(retracedUp(Env));

    context("And an admin user is logged in to a project with two invites", function () {
      const emails = ["invitee1@retraced.io", "invitee2@retraced.io"];
      const inviteIDs: string[] = [];

      before(async function () {
        const admin: any = await adminUser(Env);

        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });

      emails.forEach((email) => {
        before(async function () {
          const resp1 = await axios.post(
            `${Env.Endpoint}/admin/v1/project/${project.id}/invite`,
            { email },
            {
              headers: {
                Authorization: jwt,
              },
            }
          );
          assert(resp1);
          inviteIDs.push(resp1.data.id);
        });
      });

      context("When a call is made to list invites", function () {
        let resp;

        before(async function () {
          resp = await axios.get(`${Env.Endpoint}/admin/v1/project/${project.id}/invite`, {
            headers: {
              Authorization: jwt,
            },
          });
          assert(resp);
        });

        specify("Both invites should be returned with status 200.", function () {
          assert.strictEqual(resp.status, 200);

          assert.strictEqual(resp.data[0].id, inviteIDs[0]);
          assert.strictEqual(resp.data[0].email, emails[0]);
          assert.strictEqual(resp.data[1].id, inviteIDs[1]);
          assert.strictEqual(resp.data[1].email, emails[1]);
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The read is audited under the headless project.", async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "r",
              action: "invite.list",
            };
            const mask = {
              action: true,
              crud: true,
              actor: {
                id: true,
              },
              group: {
                id: true,
              },
            };
            const connection = await headless.query(query, mask, 1);
            const audited = connection.currentResults[0];

            assert.strictEqual(audited.action, "invite.list");
            assert.strictEqual(audited.crud, "r");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
          });
        }
      });
    });
  });
});
