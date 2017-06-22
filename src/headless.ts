import "source-map-support/register";
import * as express from "express";
import { crud } from "./models/event";
import { adminIdentity } from "./security/helpers";
import * as _ from "lodash";
import { Client } from "retraced";
import getProject from "./models/project/get";
import hydrateProject from "./models/project/hydrate";
import createProject from "./models/project/create";
import getToken from "./models/api_token/get";
import createToken from "./models/api_token/create";

const retraced = new Client({
    apiKey: process.env.HEADLESS_API_KEY,
    projectId: process.env.HEADLESS_PROJECT_ID,
    endpoint: process.env.RETRACED_API_BASE,
});

export async function audit(
    req: express.Request,
    action: string,
    crud: crud,
    record?: any,
) {
    const event: any = _.merge(
        {
          action,
          crud,
          source_ip: req.ip,
          description: `${req.method} ${req.originalUrl}`,
        },
        record,
    );
    // Determine actor
    const [userId, ok] = await adminIdentity(req);

    if (ok) {
        if (userId) {
            event.actor = {
                id: userId,
            };
        } else {
            event.isAnonymous = true;
        }
    } else {
        event.isFailure = true;
    }

    await retraced.reportEvent(event);
}

// Checks that project exists with HEADLESS_PROJECT_ID and HEADLESS_API_KEY
export async function ensureHeadlessProject() {
    if (!process.env.HEADLESS_PROJECT_ID) {
        throw new Error("HEADLESS_PROJECT_ID not defined");
    }
    if (!process.env.HEADLESS_API_KEY) {
        throw new Error("HEADLESS_API_KEY not defined");
    }

    let project: any = await getProject(process.env.HEADLESS_PROJECT_ID);
    if (project) {
        project = await hydrateProject(project);
    } else {
        project = await createProject({
            id: process.env.HEADLESS_PROJECT_ID,
            name: "Headless Retraced",
        });
    }

    let token = await getToken(process.env.HEADLESS_API_KEY);
    if (!token) {
        token = await createToken(
            project.id,
            project.environments[0].id,
            {
                name: "HEADLESS_API_KEY",
                disabled: false,
            },
            undefined,
            process.env.HEADLESS_API_KEY,
        );
    } else if (token.projectId !== project.id) {
        throw new Error("HEADLESS_API_KEY does not belong to HEADLESS_PROJECT_ID");
    }
}
