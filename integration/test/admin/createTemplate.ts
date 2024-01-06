import { Client } from "@retracedhq/retraced";
import { retracedUp } from "../pkg/retracedUp";
import adminUser from "../pkg/adminUser";
import * as Env from "../env";
import { sleep } from "../pkg/util";
import assert from "assert";
import axios from "axios";

describe("Admin create template", function () {
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

    context("And an admin user is logged in", function () {
      before(async function () {
        const admin: any = await adminUser(Env);
        jwt = admin.jwt;
        project = admin.project;
        env = admin.project.environments[0];
        adminId = admin.userId;
      });

      context("When a new template is created", function () {
        const reqBody = {
          name: "New Template",
          rule: "always",
          template: "{{}}",
        };
        let resp;

        before(async function () {
          resp = await axios.post(
            `${Env.Endpoint}/admin/v1/project/${project.id}/templates?environment_id=${env.id}`,
            reqBody,
            {
              headers: {
                Authorization: jwt,
              },
            }
          );
          assert(resp);
        });

        specify("The template resource is returned with status 201.", function () {
          const tenMinutes = 1000 * 60 * 10;
          const now = Date.now();
          const template = resp.data;

          assert.strictEqual(resp.status, 201);
          assert(template.id);
          assert.strictEqual(template.name, reqBody.name);
          assert.strictEqual(template.rule, reqBody.rule);
          assert.strictEqual(template.template, reqBody.template);
          assert.strictEqual(template.project_id, project.id);
          assert.strictEqual(template.environment_id, env.id);
          const createdDate = new Date(template.created).getTime();
          assert.strictEqual(Date.now() - createdDate < tenMinutes, true);
        });

        if (Env.HeadlessApiKey && Env.HeadlessProjectID) {
          specify("The creation is audited under the headless project.", async function () {
            this.timeout(Env.EsIndexWaitMs * 2);
            await sleep(Env.EsIndexWaitMs);
            const query = {
              crud: "c",
              action: "template.create",
            };
            const mask = {
              action: true,
              crud: true,
              actor: {
                id: true,
              },
              target: {
                id: true,
                name: true,
                fields: true,
              },
              group: {
                id: true,
              },
            };
            const connection = await headless.query(query, mask, 1);
            const audited = connection.currentResults[0];

            assert.strictEqual(audited.action, "template.create");
            assert.strictEqual(audited.crud, "c");
            assert.strictEqual(audited.group!.id, project.id);
            assert.strictEqual(audited.actor!.id, adminId);
            assert(audited.target!.id);
            assert.deepStrictEqual(audited.target!.fields, reqBody);
          });
        }
      });
    });
  });
});
