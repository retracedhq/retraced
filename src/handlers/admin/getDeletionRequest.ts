import { checkAdminAccessUnwrapped } from "../../security/helpers";
import getDeletionRequest from "../../models/deletion_request/get";
import getDeletionConfirmations from "../../models/deletion_confirmation/getByDeletionRequest";
import deleteDeletionConfirmation from "../../models/deletion_confirmation/delete";
import {
  deletionRequestHasExpired,
  deletionRequestBackoffRemaining,
} from "../../models/deletion_request";
import getUser from "../../models/user/get";

export interface GetDelReqReport {
  expired: boolean;
  backoffRemaining: number;
  outstandingConfirmations: string[];
}

export default async function handler(
  auth: string,
  projectId: string,
  environmentId: string,
  deletionRequestId: string,
): Promise<GetDelReqReport> {
  await checkAdminAccessUnwrapped(auth, projectId, environmentId);

  const request = await getDeletionRequest(deletionRequestId);
  if (!request) {
    throw { status: 404 };
  }

  const backoffRemaining = deletionRequestBackoffRemaining(request);

  const outstandingConfirmations: string[] = [];
  const confirmations = await getDeletionConfirmations(request.id);
  for (const c of confirmations) {
    if (c.received) {
      continue;
    }

    const user = await getUser(c.retracedUserId);
    if (!user) {
      console.log(`Removing bad outstanding confirmation from non-existent user ('${c.retracedUserId}')`);
      await deleteDeletionConfirmation(c.id);
      continue;
    }

    outstandingConfirmations.push(user.email);
  }

  return {
    expired: deletionRequestHasExpired(request),
    backoffRemaining: backoffRemaining.asSeconds(),
    outstandingConfirmations,
  };
}
