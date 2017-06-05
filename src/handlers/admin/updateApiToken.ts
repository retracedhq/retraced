import * as _ from "lodash";

import { checkAdminAccessUnwrapped } from "../../security/helpers";
import updateApiToken from "../../models/api_token/update";
import { ApiTokenValues } from "../../models/api_token";

// TODO(zhaytee): Do we really need all of these pass-through handler functions?
// This logic can probably be executed directly from within the controller.

export default async function handle(
  authorization: string,
  projectId: string,
  apiToken: string,
  requestBody: Partial<ApiTokenValues>,
) {
  await checkAdminAccessUnwrapped(authorization, projectId);

  if (!_.isEmpty(requestBody)) {
    await updateApiToken(apiToken, requestBody);
  }
}
