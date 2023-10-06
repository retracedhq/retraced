import jwt from "jsonwebtoken";
import config from "../config";

import ViewerDescriptor from "../models/viewer_descriptor/def";
import getViewerToken from "../models/viewer_descriptor/get";

export interface AdminClaims {
  userId: string;
  adminToken?: string;
}

export function createAdminVoucher(claims: AdminClaims): string {
  return jwt.sign(claims, config.HMAC_SECRET_ADMIN, {
    expiresIn: "21d",
  });
}

export function createViewerDescriptorVoucher(desc: ViewerDescriptor): string {
  return jwt.sign(desc, config.HMAC_SECRET_VIEWER);
}

export async function validateAdminVoucher(voucher: string): Promise<AdminClaims> {
  return new Promise<AdminClaims>((resolve, reject) => {
    jwt.verify(voucher, config.HMAC_SECRET_ADMIN, (err, claims) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(claims);
    });
  });
}

export async function validateViewerDescriptorVoucher(voucher: string): Promise<ViewerDescriptor> {
  const claims = await new Promise<ViewerDescriptor>((resolve, reject) => {
    jwt.verify(voucher, config.HMAC_SECRET_VIEWER, (err, claimsObj) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(claimsObj);
    });
  });

  const token = await getViewerToken({
    id: claims.id,
  });

  if (!token) {
    throw new Error("Invalid token");
  }

  return claims;
}
