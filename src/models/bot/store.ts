import * as pg from "pg";
import { instrumented } from "../../metrics";
import { BotAccount, CreateBotRequest } from "./types";
import getPgPool from "../../persistence/pg";
import uuidNoDashes from "../uniqueId";

export class BotStore {

  private static instance: BotStore;

  public static async default(): BotStore {
    if (BotStore.instance) {
      return BotStore.instance;
    }

    BotStore.instance = new BotStore(
      uuidNoDashes,
      await getPgPool(),
    );
    return BotStore.instance;
  }

  constructor(
    private readonly idSource: () => string,
    private readonly pool: pg.Pool,
  ) {}

  @instrumented
  public async createBot(userId: string, request: CreateBotRequest): Promise<BotAccount> {
    const id = this.idSource();
    const q = `
INSERT INTO admin_token (
  id,
  user_id,
  is_disabled,
  
  created_at,
  updated_at,
) VALUES (?, ?)`;

    const v = [
      id,
      userId,
      false,
      new Date(),
      new Date(),
    ];

    const result = await this.pool.query(q, v);
  }
}