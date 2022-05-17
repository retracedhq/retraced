import jwt from "jsonwebtoken";

import ViewerDescriptor from "../models/viewer_descriptor/def";

export interface AdminClaims {
  userId: string;
}

export function createAdminVoucher(claims: AdminClaims): string {
  return jwt.sign(claims, process.env.HMAC_SECRET_ADMIN, {
    expiresIn: "21d",
  });
}

export function createViewerDescriptorVoucher(desc: ViewerDescriptor): string {
  return jwt.sign(desc, process.env.HMAC_SECRET_VIEWER);
}

export async function validateAdminVoucher(voucher: string): Promise<AdminClaims> {
  return new Promise<AdminClaims>((resolve, reject) => {
    jwt.verify(voucher, process.env.HMAC_SECRET_ADMIN, (err, claims) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(claims);
    });
  });
}

export async function validateViewerDescriptorVoucher(voucher: string): Promise<ViewerDescriptor> {
  return new Promise<ViewerDescriptor>((resolve, reject) => {
    jwt.verify(voucher, process.env.HMAC_SECRET_VIEWER, (err, claims) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(claims);
    });
  });
}
