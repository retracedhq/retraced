import getInvite from "../models/invite/get";

export default async function (req) {
  const invitation = await getInvite({
    inviteId: req.query.id,
  });

  return {
    status: 200,
    body: JSON.stringify({ invitation }),
  };
}
