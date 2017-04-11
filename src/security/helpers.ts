import * as _ from "lodash";
import * as util from "util";

import { AdminClaims, validateAdminVoucher, validateViewerDescriptorVoucher } from "./vouchers";
import verifyProjectAccess from "./verifyProjectAccess";
import getEitapiToken from "../models/eitapi_token/get";
import ViewerDescriptor from "../models/viewer_descriptor/def";

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

export async function checkAdminAccess(req): Promise<AdminClaims> {
  const claims = await validateAdminVoucher(req.get("Authorization"));
  if (!await verifyProjectAccess({projectId: req.params.projectId, userId: claims.userId})) {
    throw { status: 404, err: new Error("Not found") };
  }

  return claims;
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
