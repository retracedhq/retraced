import { checkAdminAccess } from "../../security/helpers";
import updateUser from "../../models/user/update";
import getUser from "../../models/user/get";

export default async function (req) {
  const claims = await checkAdminAccess(req);

  if (claims.userId !== req.params.userId) {
    return {
      status: 403,
    };
  }

  const user = await updateUser({
    user_id: req.params.userId,
    timezone: req.body.timezone,
  });

  if (!user) {
    return {
      status: 404,
    };
  }

  return {
    status: 200,
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      timezone: user.timezone,
    }),
  };
}
