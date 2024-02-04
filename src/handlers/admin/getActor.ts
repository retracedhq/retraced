import { checkAdminAccess } from "../../security/helpers";
import getActor from "../../models/actor/get";

export default async function (req) {
  await checkAdminAccess(req);

  const actor = await getActor({
    actorId: req.params.actorId,
  });

  return {
    status: 200,
    body: JSON.stringify({ actor }),
  };
}
