import getInvite from "../models/team/invite/get";

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
