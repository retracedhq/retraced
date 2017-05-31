import { checkAdminAccessUnwrapped } from "../../security/helpers";
import deleteEnvironment from "../../models/environment/delete";
import getDeletionRequestByResourceId from "../../models/deletion_request/getByResourceId";
import deleteDeletionRequest from "../../models/deletion_request/delete";
import {
  deletionRequestHasExpired,
  deletionRequestBackoffRemaining,
} from "../../models/deletion_request";
import getDeletionConfirmationsByDeletionRequest from "../../models/deletion_confirmation/getByDeletionRequest";
import environmentIsEmpty from "../../models/environment/isEmpty";

export default async function handle(
  authorization: string,
  projectId: string,
  environmentId: string,
) {
  const claims = await checkAdminAccessUnwrapped(authorization, projectId, environmentId);

  // If no events exists for this env, fine, allow the deletion.
  if (true === await environmentIsEmpty({ projectId, environmentId })) {
    await deleteEnvironment({ projectId, environmentId });
    console.log(`AUDIT user ${claims.userId} deleted EMPTY environment ${environmentId}`);
    return;
  }

  // Otherwise, we'll need an existing deletion request...
  const deletionRequest = await getDeletionRequestByResourceId(environmentId);
  if (!deletionRequest) {
    throw {
      status: 403,
      err: new Error("Cannot delete a populated environment. Create a deletion request."),
    };
  }

  // ... which isn't too old...
  if (deletionRequestHasExpired(deletionRequest)) {
    // This should cascade-delete all related deletion_confirmation rows as well.
    await deleteDeletionRequest(deletionRequest.id);

    throw {
      status: 403,
      err: new Error("Existing deletion request is too old. Create a new one."),
    };
  }

  // ... which isn't still in its backoff period...
  const backoffRemaining = deletionRequestBackoffRemaining(deletionRequest);
  if (backoffRemaining) {
    throw {
      status: 403,
      err: new Error(`Cannot delete this environment until its deletion request ` +
        `backoff period has passed (${backoffRemaining.humanize(true)}).`),
    };
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
      throw {
        status: 403,
        err: new Error(`Cannot delete this environment until all confirmations have ` +
          `been received (${outstandingConfirmations} still outstanding).`),
      };
    }
  }

  // Holy crap, this environment can be deleted now!
  await deleteEnvironment({ projectId, environmentId });
  console.log(`AUDIT user ${claims.userId} deleted environment ${environmentId}`);

  // This should cascade-delete all related deletion_confirmation rows as well.
  await deleteDeletionRequest(deletionRequest.id);
  console.log(`AUDIT deletion request ${deletionRequest.id} for environment ${environmentId} closed successfully`);
}
