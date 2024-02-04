import moment from "moment";

import getPgPool from "../../persistence/pg";
import getDeletionConfirmation from "./get";
import { DeletionConfirmation } from "./";

const pgPool = getPgPool();

export default async function markReceived(id: string): Promise<DeletionConfirmation> {
  const extant = await getDeletionConfirmation(id);
  if (!extant) {
    throw new Error(`Can't find deletion confirmation to mark it received (id='${id}')`);
  }

  if (extant.received) {
    throw new Error(`Deletion confirmation has already been marked received (id='${id}'`);
  }

  extant.received = moment();

  const q = `
    update
      deletion_confirmation
    set
      received = to_timestamp($2)
    where
      id = $1
  `;
  const v = [id, extant.received.unix()];
  const response = await pgPool.query(q, v);

  if (response.rowCount === 0) {
    throw new Error(`Was unable to update deletion confirmation (update rowcount is 0)`);
  }

  return extant;
}
