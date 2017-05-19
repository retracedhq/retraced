import * as moment from "moment";
import * as uuid from "uuid";

import { checkAdminAccessUnwrapped } from "../../security/helpers";
import getDeletionRequestByResourceId from "../../models/deletion_request/getByResourceId";
import deleteDeletionRequest from "../../models/deletion_request/delete";
import createDeletionRequest from "../../models/deletion_request/create";
import createDeletionConfirmation from "../../models/deletion_confirmation/create";
import getUser from "../../models/user/get";

export interface CreateDelReqRequestBody {
  resourceKind: string;
  resourceId: string;
  backoffInterval: number;
  confirmationUserIds: string[];
}

export default async function handle(
  authorization: string,
  projectId: string,
  environmentId: string,
  requestBody: CreateDelReqRequestBody,
) {
  const claims = await checkAdminAccessUnwrapped(authorization, projectId, environmentId);

  const extantDelReq = await getDeletionRequestByResourceId(requestBody.resourceId);
  if (extantDelReq) {
    // If this existing deletion request is too old, we kill it and allow a
    // new one to be created in its place.
    if (extantDelReq.created.isBefore(moment().subtract(1, "month"))) {
      await deleteDeletionRequest(extantDelReq.id);
    } else {
      // Otherwise, it's a no no.
      return {
        status: 409, // Conflict
        body: {
          error: "A deletion request already exists for that resource.",
        },
      };
    }
  }

  // TODO(zhaytee): Make sure that the referenced resource actually exists?

  const newDeletionRequest = await createDeletionRequest({
    resourceKind: requestBody.resourceKind,
    resourceId: requestBody.resourceId,
    backoffInterval: moment.duration(requestBody.backoffInterval, "seconds"),
  });

  // For returning to the API caller
  const outstandingConfirmations: string[] = [];

  for (const userId of requestBody.confirmationUserIds) {
    const user = await getUser(userId);
    if (!user) {
      console.log(`Deletion request contained user id we don't know about: '${userId}'`);
      continue;
    }

    if (!user.email) {
      console.log(`User '${userId}' in deletion request has no email address (o_O)`);
      continue;
    }

    // TODO(zhaytee): Enqueue outgoing email with fancy template and all that.

    const newConfirmation = await createDeletionConfirmation({
      deletionRequestId: newDeletionRequest.id,
      retracedUserId: userId,
      visibleCode: uuid.v4().replace(/-/g, ""),
    });

    outstandingConfirmations.push(user.email);
  }

  return {
    status: 201,
    body: {
      id: newDeletionRequest.id,
      outstandingConfirmations,
    },
  };
}
