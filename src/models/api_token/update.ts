import getPgPool from "../../persistence/pg";
import getApiToken from "./get";
import { ApiToken, ApiTokenValues } from "./";

const pgPool = getPgPool();

export default async function update(tokenId: string, fields: Partial<ApiTokenValues>): Promise<ApiToken> {
  const extant = await getApiToken(tokenId);
  if (!extant) {
    throw new Error(`Can't find api token to be updated (token='${tokenId}')`);
  }
  if (fields.disabled === undefined && fields.name === undefined) {
    return extant;
  }

  let sets: string[] = [];
  const v: any[] = [tokenId];
  let curField = 2;
  if (fields.disabled !== undefined) {
    extant.disabled = fields.disabled;
    sets.push(`disabled = $${curField++}`);
    v.push(fields.disabled);
  }
  if (fields.name !== undefined) {
    extant.name = fields.name;
    sets.push(`name = $${curField++}`);
    v.push(fields.name);
  }

  const q = `
    update
      token
    set
      ${sets.join(",")}
    where
      token = $1
  `;

  const response = await pgPool.query(q, v);

  if (response.rowCount === 0) {
    throw new Error(`Was unable to update api token (update rowcount is 0)`);
  }

  return extant;
}
