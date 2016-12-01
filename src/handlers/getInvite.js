import getInvite from "../models/team/invite/get";

export default function handler(req) {
  return new Promise((resolve, reject) => {
    getInvite(req.query.id)
      .then((invitation) => {
        resolve({ invitation: invitation });
      })
      .catch(reject);
  });
};
