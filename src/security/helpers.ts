import _ from "lodash";

import { AdminClaims, validateAdminVoucher, validateViewerDescriptorVoucher } from "./vouchers";
import verifyProjectAccess from "./verifyProjectAccess";
import verifyEnvironmentAccess from "./verifyEnvironmentAccess";
import getEitapiToken from "../models/eitapi_token/get";
import ViewerDescriptor from "../models/viewer_descriptor/def";
import { EnterpriseToken } from "../models/eitapi_token";
import { logger } from "../logger";
import { AdminTokenStore } from "../models/admin_token/store";

// Authorization: Token token=abcdef
export function apiTokenFromAuthHeader(authHeader?: string): string {
  if (!authHeader) {
    throw {
      status: 401,
      err: new Error("Missing Authorization header"),
    };
  }

  const parts = authHeader.match(/token=(.+)/);
  if (!parts) {
    throw {
      status: 401,
      err: new Error("Invalid Authorization header form"),
    };
  }
  if (parts.length < 2 || _.isEmpty(parts[1])) {
    throw {
      status: 401,
      err: new Error("Missing token in Authorization header"),
    };
  }

  return parts[1];
}

async function parseClaims(authHeader: string) {
  let claims;
  const tokenParts = authHeader.split(" ");

  if (tokenParts && tokenParts.length >= 2) {
    logger.debug("validating admin against token");
    // eslint-disable-next-line
    const tokens = {};
    tokens[tokenParts[0].split("=")[0]] = tokenParts[0].split("=")[1];
    tokens[tokenParts[1].split("=")[0]] = tokenParts[1].split("=")[1];
    if (tokenParts[2]) {
      tokens[tokenParts[2].split("=")[0]] = tokenParts[2].split("=")[1];
    }
    claims = await AdminTokenStore.default().verifyTokenOr401(
      tokens["id"],
      tokens["token"],
      tokens["admin_token"]
    );
  } else {
    logger.debug("validating jwt voucher");
    claims = await validateAdminVoucher(authHeader);
  }
  return claims;
}

async function checkEnvAccess(environmentId: string, claims: AdminClaims) {
  if (!(await verifyEnvironmentAccess({ environmentId, ...claims }))) {
    logger.child({ environmentId, ...claims }).debug("checking project access");
    throw { status: 404, err: new Error("Not found") };
  }
}

async function checkProjectAccess(projectId: string, claims) {
  if (!(await verifyProjectAccess({ projectId, ...claims }))) {
    logger.child({ projectId, ...claims }).debug("checking project access");
    throw { status: 404, err: new Error("Not found") };
  }
}

export async function checkAdminAccessUnwrapped(
  authHeader: string,
  projectId?: string,
  environmentId?: string
): Promise<AdminClaims> {
  if (_.isEmpty(authHeader)) {
    throw { status: 401, err: new Error("Missing Authorization header") };
  }
  const claims = await parseClaims(authHeader);

  // If we have an admin token, we're done
  if (claims.adminToken) {
    return claims;
  }

  // Some endpoints don't reference a project (such as list projects)
  if (projectId) {
    await checkProjectAccess(projectId, claims);
  }

  // some endpoints don't reference an environment, or don't validate against it
  if (environmentId) {
    await checkEnvAccess(environmentId, claims);
  }
  return claims;
}

export async function checkAdminAccess(req): Promise<AdminClaims> {
  return checkAdminAccessUnwrapped(req.get("Authorization"), req.params.projectId, req.params.environment_id);
}

export async function adminIdentity(req): Promise<[string | null, boolean]> {
  let claims;

  try {
    claims = await checkAdminAccess(req);
  } catch (err) {
    if (err.status === 401) {
      return [null, false];
    }
    throw err;
  }

  return [claims.userId, true];
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
