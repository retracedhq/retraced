
import { checkAdminAccessUnwrapped } from "../../security/helpers";
import updateApiToken from "../../models/api_token/update";
import { ApiToken, ApiTokenValues } from "../../models/api_token";

// TODO(zhaytee): Do we really need all of these pass-through handler functions?
// This logic can probably be executed directly from within the controller.

export default async function handle(
  authorization: string,
  projectId: string,
  apiToken: string,
  values: Partial<ApiTokenValues>,
): Promise<ApiToken> {
  await checkAdminAccessUnwrapped(authorization, projectId);

  return await updateApiToken(apiToken, values);
}
