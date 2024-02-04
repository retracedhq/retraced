import { checkAdminAccessUnwrapped } from "../../security/helpers";
import deleteApiToken from "../../models/api_token/delete";

export default async function (auth: string, projectId: string, tokenId: string): Promise<void> {
  await checkAdminAccessUnwrapped(auth, projectId);

  await deleteApiToken({
    projectId,
    tokenId,
  });
}
