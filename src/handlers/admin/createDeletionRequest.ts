import * as moment from "moment";

import { checkAdminAccessUnwrapped } from "../../security/helpers";
import getDeletionRequestByResourceId from "../../models/deletion_request/getByResourceId";
import deleteDeletionRequest from "../../models/deletion_request/delete";
import createDeletionRequest from "../../models/deletion_request/create";
import createDeletionConfirmation from "../../models/deletion_confirmation/create";

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
    // If this existing deletion request is too old, we kill it and allow this
    // new one to be created in its place.
    if (extantDelReq.created.isBefore(moment().subtract(1, "month"))) {
      await deleteDeletionRequest(extantDelReq.id);
    } else {
      // Otherwise, it's a no no.
      return {
        status: 409, // Conflict
        body: JSON.stringify({
          error: "A deletion request already exists for that resource.",
        }),
      };
    }
  }

  // TODO(zhaytee): Create the deletion request.
  // TODO(zhaytee): Create all necessary deletion confirmations.

  return { status: 201 };
}
