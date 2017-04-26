import "source-map-support/register";
import { checkEitapiAccess } from "../../security/helpers";

import handler from "../graphql/handler";

export default async function(req) {
  const eitapiToken = await checkEitapiAccess(req);

  return await handler(req, {
    projectId: eitapiToken.project_id,
    environmentId: eitapiToken.environment_id,
    groupId: eitapiToken.group_id,
  });
}
