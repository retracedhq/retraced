import * as pg from "pg";
import getPgPool from "../persistence/pg";
import { apiTokenFromAuthHeader } from "./helpers";
import getApiToken from "../models/api_token/get";
import { ApiToken } from "../models/api_token/index";

export default class Authenticator {

  public static default() {
    return new Authenticator(getPgPool());
  }

  constructor(
    private readonly pgPool: pg.Pool,
  ) {}

  public async getApiTokenOr401(authorization: string, projectId: string): Promise<ApiToken> {
    const apiTokenId = apiTokenFromAuthHeader(authorization);
    const apiToken: any = await getApiToken(apiTokenId, this.pgPool);
    const validAccess = apiToken && apiToken.project_id === projectId;
    if (!validAccess) {
      throw { status: 401, err: new Error("Unauthorized") };
    }

    return apiToken;
  }
}
