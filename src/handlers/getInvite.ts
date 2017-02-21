import getInvite from "../models/group/invite/get";

export default async function (req) {
  const invitation = await getInvite({
    inviteId: req.query.id,
  });

  return {
    status: 200,
    body: JSON.stringify({ invitation }),
  };
}
