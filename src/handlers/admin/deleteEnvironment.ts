import * as moment from "moment";

import { checkAdminAccessUnwrapped } from "../../security/helpers";
import deleteEnvironment from "../../models/environment/delete";
import getDeletionRequestByResourceId from "../../models/deletion_request/getByResourceId";
import deleteDeletionRequest from "../../models/deletion_request/delete";
import getDeletionConfirmationsByDeletionRequest from "../../models/deletion_confirmation/getByDeletionRequest";
import environmentHasEsIndex from "../../models/environment/hasEsIndex";

export default async function handle(
  authorization: string,
  projectId: string,
  environmentId: string,
) {
  const claims = await checkAdminAccessUnwrapped(authorization, projectId, environmentId);

  // If no ES index exists for this env, fine, allow the deletion.
  if (false === await environmentHasEsIndex({ projectId, environmentId })) {
    await deleteEnvironment({ projectId, environmentId });
    console.log(`AUDIT user ${claims.userId} deleted EMPTY environment ${environmentId}`);
    return { status: 204 };
  }

  // Otherwise, we'll need an existing deletion request...
  const deletionRequest = await getDeletionRequestByResourceId(environmentId);
  if (!deletionRequest) {
    return {
      status: 403,
      body: JSON.stringify({
        error: "Cannot delete a populated environment. Create a deletion request.",
      }),
    };
  }

  // ... which isn't too old...
  if (deletionRequest.created.isBefore(moment().subtract(1, "month"))) {
    // This should cascade-delete all related deletion_confirmation rows as well.
    await deleteDeletionRequest(deletionRequest.id);

    return {
      status: 403,
      body: JSON.stringify({
        error: "Existing deletion request is too old. Create a new one.",
      }),
    };
  }

  // ... which isn't still in its backoff period...
  if (deletionRequest.backoffInterval) {
    const backoffThresh = deletionRequest.created.add(
      moment(deletionRequest.backoffInterval),
    );
    if (backoffThresh.isAfter()) {
      return {
        status: 403,
        body: JSON.stringify({
          error: `Cannot delete this environment until its deletion request ` +
          `backoff period has passed (in ${backoffThresh.fromNow()}).`,
        }),
      };
    }
  }

  // ... and whose confirmations (if any) have all been received.
  const confirmations = await getDeletionConfirmationsByDeletionRequest(deletionRequest.id);
  if (confirmations.length > 0) {
    let outstandingConfirmations = 0;
    for (const c of confirmations) {
      if (!c.received) {
        outstandingConfirmations++;
      }
    }

    if (outstandingConfirmations > 0) {
      return {
        status: 403,
        body: JSON.stringify({
          error: `Cannot delete this environment until all confirmations have ` +
          `been received (${outstandingConfirmations} still outstanding).`,
        }),
      };
    }
  }

  // Holy crap, this environment can be deleted now!
  await deleteEnvironment({ projectId, environmentId });
  console.log(`AUDIT user ${claims.userId} deleted environment ${environmentId}`);

  // This should cascade-delete all related deletion_confirmation rows as well.
  await deleteDeletionRequest(deletionRequest.id);
  console.log(`AUDIT deletion request ${deletionRequest.id} for environment ${environmentId} closed successfully`);

  return { status: 204 };
}
