
import * as _ from "lodash";

import { AdminClaims, validateAdminVoucher, validateViewerDescriptorVoucher } from "./vouchers";
import verifyProjectAccess from "./verifyProjectAccess";
import verifyEnvironmentAccess from "./verifyEnvironmentAccess";
import getEitapiToken from "../models/eitapi_token/get";
import ViewerDescriptor from "../models/viewer_descriptor/def";
import { EnterpriseToken } from "../models/eitapi_token";

// Authorization: Token token=abcdef
export function apiTokenFromAuthHeader(authHeader?: string): string {
  if (!authHeader) {
    throw {
      status: 401, err: new Error("Missing Authorization header"),
    };
  }

  const parts = authHeader.match(/token=(.+)/);
  if (!parts) {
    throw {
      status: 401, err: new Error("Invalid Authorization header form"),
    };
  }
  if (parts.length < 2 || _.isEmpty(parts[1])) {
    throw {
      status: 401, err: new Error("Missing token in Authorization header"),
    };
  }

  return parts[1];
}

export async function checkAdminAccessUnwrapped(authHeader: string, projectId?: string, environmentId?: string): Promise<AdminClaims> {

  const claims = await validateAdminVoucher(authHeader);

  // Some endpoints don't reference a project (such as list projects)
  if (!projectId) {
    return claims;
  }

  if (!await verifyProjectAccess({ projectId, userId: claims.userId })) {
    throw { status: 404, err: new Error("Not found") };
  }

  // some endpoints don't reference an environment, or don't validate against it
  if (!environmentId) {
    return claims;
  }

  if (!await verifyEnvironmentAccess({ environmentId, userId: claims.userId })) {
    throw { status: 404, err: new Error("Not found") };
  }

  return claims;
}

export async function checkAdminAccess(req): Promise<AdminClaims> {
  return checkAdminAccessUnwrapped(req.get("Authorization"), req.params.projectId, req.params.environment_id);
}

export async function checkEitapiAccess(req): Promise<EnterpriseToken> {
  return checkEitapiAccessUnwrapped(req.get("Authorization"));
}
export async function checkEitapiAccessUnwrapped(auth: string): Promise<EnterpriseToken> {
  const eitapiTokenId = apiTokenFromAuthHeader(auth);
  const eitapiToken: EnterpriseToken | null = await getEitapiToken({
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
