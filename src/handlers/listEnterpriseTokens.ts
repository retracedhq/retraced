import "source-map-support/register";
import * as express from "express";
import getApiToken from "../models/api_token/get";
import { apiTokenFromAuthHeader } from "../security/helpers";
import modelsListEnterpriseTokens from "../models/eitapi_token/list";
import { EnterpriseToken } from "./createEnterpriseToken";
import getPgPool from "../persistence/pg";
import { defaultEventCreater, CreateEventRequest } from "./createEvent";

const pgPool = getPgPool();

export async function listEnterpriseTokens(
  authorization: string,
  projectId: string,
  groupId: string,
  req: express.Request,
) {
  const apiTokenId = apiTokenFromAuthHeader(authorization);
  const apiToken: any = await getApiToken(apiTokenId, pgPool.query.bind(pgPool));
  const validAccess = apiToken && apiToken.project_id === projectId;

  if (!validAccess) {
    throw { status: 401, err: new Error("Unauthorized") };
  }

  const tokens: EnterpriseToken[] = (await modelsListEnterpriseTokens({
      projectId,
      groupId,
      environmentId: apiToken.environment_id,
    }))
    .map(({ id, display_name}) => {
      return {
        token: id,
        display_name,
      };
    });

  const thisEvent: CreateEventRequest = {
    action: "eitapi_tokens.list",
    crud: "r",
    actor: {
      id: "Publisher API",
      name: apiToken.name,
    },
    group: {
      id: groupId,
    },
    description: `${req.method} ${req.originalUrl}`,
    source_ip: req.ip,
  };
  await defaultEventCreater.saveRawEvent(
    projectId,
    apiToken.environment_id,
    thisEvent,
  );

  return { status: 200, body: tokens };
}
