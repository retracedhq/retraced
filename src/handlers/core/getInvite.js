import "source-map-support/register";
import getInvite from "../../models/group/invite/get";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    getInvite({ inviteId: req.query.id })
      .then((invitation) => {
        resolve({
          status: 200,
          body: JSON.stringify({ invitation: invitation }),
        });
      })
      .catch(reject);
  });
};
