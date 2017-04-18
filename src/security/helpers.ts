import * as querystring from "querystring";
import * as _ from "lodash";
import * as util from "util";

import { AdminClaims, validateAdminVoucher, validateViewerDescriptorVoucher } from "./vouchers";
import verifyProjectAccess from "./verifyProjectAccess";
import verifyEnvironmentAccess from "./verifyEnvironmentAccess";
import getEitapiToken from "../models/eitapi_token/get";
import ViewerDescriptor from "../models/viewer_descriptor/def";
import findTargets from "../models/target/find";

// Authorization: Token token=abcdef
export function apiTokenFromAuthHeader(authHeader?: string): string {
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const parts = authHeader.match(/token=(.+)/);
  if (!parts) {
    console.log(`authHeader='${authHeader}', parts=${util.inspect(parts)}`);
    throw new Error("Invalid Authorization header format");
  }
  if (parts.length < 2 || _.isEmpty(parts[1])) {
    throw new Error("Missing token in Authorization header");
  }

  return parts[1];
}

export async function checkAdminAccessUnwrapped(voucher: string, projectId?: string, environmentId?: string): Promise<AdminClaims> {
  const claims = await validateAdminVoucher(voucher);

  // Some endpoints don't reference a project (such as list projects)
  if (!projectId) {
    return claims;
  }

  if (!await verifyProjectAccess({projectId, userId: claims.userId})) {
    throw { status: 404, err: new Error("Not found") };
  }

  // some endpoints don't reference an environment, or don't validate against it
  if (!environmentId) {
    return claims;
  }

  if (!await verifyEnvironmentAccess({environmentId, userId: claims.userId})) {
    throw { status: 404, err: new Error("Not found") };
  }

  return claims;
}

export async function checkAdminAccess(req): Promise<AdminClaims> {
  return checkAdminAccessUnwrapped(req.get("Authorization"), req.params.projectId, req.params.environment_id);
}

export async function checkEitapiAccess(req) {
  const eitapiTokenId = apiTokenFromAuthHeader(req.get("Authorization"));
  const eitapiToken = await getEitapiToken({
    eitapiTokenId,
  });
  if (!eitapiToken) {
    throw { status: 401, err: new Error("Unauthorized") };
  }
  return eitapiToken;
}

export async function checkViewerAccess(req): Promise<ViewerDescriptor> {
  return await validateViewerDescriptorVoucher(req.get("Authorization"));
}

export async function scopeTargets(claims: ViewerDescriptor): Promise<string[]> {
  const targetIds: string[] = [];

  if (claims.scope) {
    const scope = querystring.parse(claims.scope);
    const findTargetsOpts = {
      foreignTargetIds: [scope.target_id],
      environmentId: claims.environmentId,
    };
    const targets = await findTargets(findTargetsOpts);
    for (const target of targets) {
      targetIds.push(target.id);
    }
  }

  return targetIds;
}
