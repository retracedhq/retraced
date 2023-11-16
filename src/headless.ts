import express from "express";
import { EventFields } from "./models/event";
import { adminIdentity } from "./security/helpers";
import _ from "lodash";
import { Client, Event, CRUD } from "./_lib/index";
import getProject from "./models/project/get";
import hydrateProject from "./models/project/hydrate";
import createProject from "./models/project/create";
import getToken from "./models/api_token/get";
import getEnvironment from "./models/environment/get";
import createToken from "./models/api_token/create";
import createEnvironment from "./models/environment/create";
import { logger } from "./logger";
import config from "./config";

const enabled = !!(config.HEADLESS_API_KEY && config.HEADLESS_PROJECT_ID && config.HEADLESS_ENV_ID);

const retraced = new Client({
  apiKey: config.HEADLESS_API_KEY || "",
  projectId: config.HEADLESS_PROJECT_ID || "",
  endpoint: config.RETRACED_API_BASE || "",
});

export async function reportEvents(events: Event[]) {
  if (enabled) {
    await retraced.reportEvents(events);
  }
}

export async function audit(req: express.Request, action: string, crudOperation: CRUD, record?: any) {
  if (!enabled) {
    return;
  }
  const fromReq = await fromRequest(req);
  const event = makeEvent(action, crudOperation, fromReq, record);

  await retraced.reportEvent(event);
}

export function stringifyFields(source: any): EventFields {
  const fields: EventFields = {};

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const value = source[key];
      if (value != null) {
        fields[key] = value.toString();
      }
    }
  }

  return fields;
}

async function fromRequest(req: express.Request) {
  const event: any = {
    group: {
      id: req.params.projectId,
    },
    source_ip: req.ip,
    description: `${req.method} ${req.originalUrl}`,
  };
  // Determine actor
  const [userId, ok] = await adminIdentity(req);

  if (ok) {
    if (userId) {
      event.actor = {
        id: userId,
      };
    } else {
      event.is_anonymous = true;
    }
  } else {
    event.is_failure = true;
  }

  return event;
}

function makeEvent(action: string, crudOperation: CRUD, fromRequestInfo: any, record?: any) {
  const event: any = _.merge(
    {
      action,
      crud: crudOperation,
    },
    fromRequestInfo,
    record
  );

  if (event.fields) {
    event.fields = stringifyFields(event.fields);
  }
  if (event.target && event.target.fields) {
    event.target.fields = stringifyFields(event.target.fields);
  }
  if (event.actor && event.actor.fields) {
    event.actor.fields = stringifyFields(event.actor.fields);
  }

  return event;
}

export interface BootstrapOpts {
  projectId: string;
  apiKey: string;
  environmentId: string;
  projectName: string;
  environmentName: string;
  tokenName: string;
  keyVarRef: string;
  projectVarRef: string;
  envVarRef: string;
}

// Checks that project exists with HEADLESS_PROJECT_ID and HEADLESS_API_KEY
export async function ensureHeadlessProject() {
  logger.info(`Headless Retraced audit logging is ${enabled ? "enabled" : "disabled"}`);
  if (!enabled) {
    return;
  }
  await bootstrapProject({
    projectId: config.HEADLESS_PROJECT_ID || "",
    apiKey: config.HEADLESS_API_KEY || "",
    environmentId: config.HEADLESS_PROJECT_ENV || "",
    projectName: "Headless Retraced",
    environmentName: "HEADLESS_PROJECT_ENV",
    tokenName: "HEADLESS_API_KEY",
    keyVarRef: "HEADLESS_API_KEY",
    projectVarRef: "HEADLESS_PROJECT_ID",
    envVarRef: "HEADLESS_PROJECT_ENV",
  });
}

export async function bootstrapProject(opts: BootstrapOpts) {
  let project: any = await getProject(opts.projectId);

  if (project && project.id) {
    project = await hydrateProject(project);
  } else {
    project = await createProject({
      id: opts.projectId,
      name: opts.projectName,
      env: opts.environmentId ? [] : undefined,
    });
  }

  let env = await getEnvironment(opts.environmentId);
  if (!env) {
    env = await createEnvironment({
      id: opts.environmentId,
      name: opts.environmentName,
      projectId: project.id,
    });
  } else if (env.projectId !== project.id) {
    throw new Error(`env ${opts.envVarRef} does not belong to project ${opts.projectVarRef}`);
  }

  // TODO: Take 2 args for token while bootstraping
  // Has to be secure and cryptic
  // Dont use _read & _write
  // Take 2 command line args apiKeyWrite & apiKeyRead
  const token = await getToken(opts.apiKey);
  if (!token) {
    await createToken(
      project.id,
      env.id,
      {
        name: opts.tokenName,
        disabled: false,
      },
      undefined,
      opts.apiKey
    );
  } else if (token.projectId !== project.id) {
    throw new Error(`api key ${opts.keyVarRef} does not belong to project ${opts.projectVarRef}`);
  }
}
