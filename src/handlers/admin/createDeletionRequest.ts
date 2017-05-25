import * as moment from "moment";
import * as uuid from "uuid";

import nsq from "../../persistence/nsq";
import { checkAdminAccessUnwrapped } from "../../security/helpers";
import getDeletionRequestByResourceId from "../../models/deletion_request/getByResourceId";
import deleteDeletionRequest from "../../models/deletion_request/delete";
import createDeletionRequest from "../../models/deletion_request/create";
import createDeletionConfirmation from "../../models/deletion_confirmation/create";
import getUser from "../../models/user/get";
import getEnvironment from "../../models/environment/get";
import listTeamMembers from "../../models/team/listTeamMembers";

// TODO(zhaytee): This should be configurable at some level.
const defaultBackoffInterval = 60 * 60 * 48; // 48 hours

export interface CreateDelReqRequestBody {
  resourceKind: string;
  resourceId: string;
}

export interface CreateDelReqReport {
  id: string;
  outstandingConfirmations: string[];
}

export default async function handle(
  authorization: string,
  projectId: string,
  environmentId: string,
  requestBody: CreateDelReqRequestBody,
) {
  const claims = await checkAdminAccessUnwrapped(authorization, projectId, environmentId);
  const thisUserId = claims.userId;

  const extantDelReq = await getDeletionRequestByResourceId(requestBody.resourceId);
  if (extantDelReq) {
    // If this existing deletion request is too old, we kill it and allow a
    // new one to be created in its place.
    if (extantDelReq.created.isBefore(moment().subtract(1, "month"))) {
      await deleteDeletionRequest(extantDelReq.id);
    } else {
      // Otherwise, it's a no no.
      throw {
        status: 409,
        err: new Error("A deletion request already exists for that resource."),
      };
    }
  }

  let resourceName = "Unknown";
  switch (requestBody.resourceKind) {
    case "environment":
      const env = await getEnvironment(requestBody.resourceId);
      if (!env) {
        throw {
          status: 400,
          err: new Error(`Environment not found: id='${requestBody.resourceId}'`),
        };
      }
      resourceName = env.name;
      break;

    default:
      throw {
        status: 400,
        err: new Error(`Unhandled resource kind: '${requestBody.resourceKind}'`),
      };
  }

  // Currently, we expect approval from all other team members.
  // TODO(zhaytee): Allow this list to be configured at some level.
  let confirmationUserIds: string[] = [];
  const teamMembers: any = await listTeamMembers({ projectId });
  for (const member of teamMembers) {
    if (member.id !== thisUserId) {
      confirmationUserIds.push(member.id);
    }
  }

  const newDeletionRequest = await createDeletionRequest({
    resourceKind: requestBody.resourceKind,
    resourceId: requestBody.resourceId,
    backoffInterval: moment.duration(defaultBackoffInterval, "seconds"),
  });

  // For returning to the API caller
  const outstandingConfirmations: string[] = [];

  // Catch any issues with confirmation creation.
  // If there's a problem, we roll back the deletion request to prevent the
  // scenario where a deletion request exists that requires no approval.
  try {
    for (const userId of confirmationUserIds) {
      const user = await getUser(userId);
      if (!user) {
        console.log(`Deletion request contained user id we don't know about: '${userId}'`);
        continue;
      }

      const code = uuid.v4().replace(/-/g, "");

      await createDeletionConfirmation({
        deletionRequestId: newDeletionRequest.id,
        retracedUserId: userId,
        visibleCode: code,
      });

      nsq.produce("emails", JSON.stringify({
        to: user.email,
        subject: "Your approval is required for a critical operation.",
        template: "retraced/deletion-request",
        context: {
          approve_url: `${process.env.RETRACED_APP_BASE}/project/${projectId}/${environmentId}/approve/${code}`,
          resource_kind: newDeletionRequest.resourceKind,
          resource_name: resourceName,
        },
      }));

      outstandingConfirmations.push(user.email);
    }
  } catch (err) {
    console.log(`Rollback! Failed to create necessary deletion confirmations: ${err}`);
    await deleteDeletionRequest(newDeletionRequest.id);
    throw {
      status: 500,
      err,
    };
  }

  return {
    id: newDeletionRequest.id,
    outstandingConfirmations,
  };
}
