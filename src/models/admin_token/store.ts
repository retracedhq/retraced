import _ from "lodash";
import pg from "pg";
import bcrypt from "bcrypt";
import { instrument, instrumented } from "../../metrics";
import { AdminToken } from "./types";
import getPgPool from "../../persistence/pg";
import uuidNoDashes from "../uniqueId";
import { AdminClaims } from "../../security/vouchers";
import { logger } from "../../logger";

export class AdminTokenStore {
  public static default(): AdminTokenStore {
    if (AdminTokenStore.instance) {
      return AdminTokenStore.instance;
    }

    AdminTokenStore.instance = new AdminTokenStore(uuidNoDashes, getPgPool());
    return AdminTokenStore.instance;
  }

  private static instance: AdminTokenStore;

  constructor(
    private readonly idSource: () => string,
    private readonly pool: pg.Pool
  ) {}

  @instrumented
  public async createAdminToken(userId: string): Promise<AdminToken> {
    const id = this.idSource();
    const token = this.idSource();

    const tokenBcrypt = await instrument("adminToken.bcrypt", () =>
      bcrypt.hash(token, 12)
    );
    const created = new Date();

    const q = `
INSERT INTO admin_token (
  id,
  user_id,
  token_bcrypt,
  created
) VALUES ($1, $2, $3, $4)`;

    const v = [id, userId, tokenBcrypt, created];

    await this.pool.query(q, v);

    return {
      id,
      userId,
      tokenBcrypt,
      token,
      disabled: false,
      createdAt: created,
    };
  }

  @instrumented
  public async verifyTokenOr401(
    id: string,
    plaintextToken: string,
    adminToken?: string
  ): Promise<AdminClaims> {
    if (adminToken) {
      const q = `SELECT * from token WHERE token = $1 AND disabled = FALSE`;
      const v = [adminToken];
      const res = await this.pool.query(q, v);
      if (_.isEmpty(res.rows)) {
        throw { status: 401, err: new Error("Invalid admin_token") };
      }
    }

    const q = `SELECT * FROM admin_token WHERE id = $1 AND disabled = FALSE`;

    const v = [id];

    const res = await this.pool.query(q, v);
    if (_.isEmpty(res.rows)) {
      throw { status: 401, err: new Error("Invalid ID or token") };
    }

    const { user_id, token_bcrypt } = res.rows[0];

    const valid = await bcrypt.compare(plaintextToken, token_bcrypt);
    if (!valid) {
      logger.info(`token failed bcrypt compare; result was ${valid}`);
      throw { status: 401, err: new Error("Invalid ID or token") };
    }

    const claims: {
      userId: string;
      adminToken?: string;
    } = {
      userId: user_id,
    };
    if (adminToken) {
      claims.adminToken = adminToken;
    }

    return claims;
  }
}
