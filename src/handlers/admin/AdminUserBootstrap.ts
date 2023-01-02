import getUser from "../../models/user/getByExternalAuth";
import createUser, { ERR_DUPLICATE_EMAIL } from "../../models/user/create";
import { apiTokenFromAuthHeader } from "../../security/helpers";
import { createAdminVoucher } from "../../security/vouchers";
import { AdminTokenStore } from "../../models/admin_token/store";
import express from "express";
import config from "../../config";

export interface ExternalAuth {
  email: string;
  upstreamToken: string;
  inviteId?: string;
}

export class AdminUserBootstrap {
  public static default() {
    return new AdminUserBootstrap(config.ADMIN_ROOT_TOKEN);
  }

  constructor(private readonly sharedSecret?: string) {}

  public async handle(auth: string | undefined, claims: ExternalAuth) {
    let token;
    try {
      token = apiTokenFromAuthHeader(auth?.toString());
    } catch (err) {
      throw { status: 404, err: new Error("Not Found") };
    }

    if (token !== this.sharedSecret) {
      throw { status: 404, err: new Error("Not Found") };
    }

    if (!claims || !claims.email) {
      throw {
        status: 400,
        err: new Error("Missing or invalid parameter: `claims.email`"),
      };
    }

    claims.upstreamToken = "ADMIN_ROOT_TOKEN";

    let user = await getUser({
      email: claims.email,
      authId: claims.upstreamToken,
    });

    if (user && user.external_auth_id !== "ADMIN_ROOT_TOKEN") {
      throw {
        status: 400,
        err: new Error("User exists and was not created via admin token"),
      };
    } else if (!user) {
      try {
        user = await createUser({
          email: claims.email,
          authId: claims.upstreamToken,
        });
      } catch (err) {
        if (err === ERR_DUPLICATE_EMAIL) {
          throw { status: 409, err: new Error("Email already exists") };
        }
        throw err;
      }
    }
    const voucher = createAdminVoucher({
      userId: user.id,
    });

    let admintoken = await AdminTokenStore.default().createAdminToken(user.id);

    const response = {
      user: {
        email: user.email,
        id: user.id,
        timezone: user.timezone,
      },
      token: voucher,
      adminToken: admintoken,
    };

    return {
      status: 200,
      body: JSON.stringify(response),
    };
  }

  public handler() {
    return (req: express.Request) =>
      this.handle(req.get("Authorization"), req.body && req.body.claims);
  }
}
