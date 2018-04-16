import * as pg from "pg";
import * as bcrypt from "bcrypt";
import { instrument, instrumented } from "../../metrics";
import { AdminToken } from "./types";
import getPgPool from "../../persistence/pg";
import uuidNoDashes from "../uniqueId";

export class AdminTokenStore {

  public static default(): AdminTokenStore {
    if (AdminTokenStore.instance) {
      return AdminTokenStore.instance;
    }

    AdminTokenStore.instance = new AdminTokenStore(
      uuidNoDashes,
      getPgPool(),
    );
    return AdminTokenStore.instance;
  }

  private static instance: AdminTokenStore;
  constructor(
    private readonly idSource: () => string,
    private readonly pool: pg.Pool,
  ) {}

  @instrumented
  public async createAdminToken(userId: string): Promise<AdminToken> {
    const id = this.idSource();
    const token = this.idSource();

    const tokenBcrypt = await instrument(
      "adminToken.bcrypt",
      () => bcrypt.hash(token, 12),
    );
    let created = new Date();

    const q = `
INSERT INTO admin_token (
  id,
  user_id,
  token_bcrypt,
  created
) VALUES ($1, $2, $3, $4)`;

    const v = [
      id,
      userId,
      token,
      created,
    ];

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
}
