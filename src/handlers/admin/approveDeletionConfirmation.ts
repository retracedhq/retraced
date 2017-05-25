import { checkAdminAccessUnwrapped } from "../../security/helpers";
import markDeletionConfirmationReceived from "../../models/deletion_confirmation/markReceived";
import getDeletionConfirmationByVisibleCode from "../../models/deletion_confirmation/getByVisibleCode";

export default async function handle(
  authorization: string,
  projectId: string,
  environmentId: string,
  code: string,
) {
  const claims = await checkAdminAccessUnwrapped(authorization, projectId, environmentId);

  const extant = await getDeletionConfirmationByVisibleCode(code);
  if (!extant) {
    throw {
      status: 404,
      err: new Error("No such confirmation code"),
    };
  }

  // Kind of overkill, but... I guess it can't hurt.
  if (extant.retracedUserId !== claims.userId) {
    throw { status: 404 }; // No access? No knowledge.
  }

  await markDeletionConfirmationReceived(extant.id);
}
