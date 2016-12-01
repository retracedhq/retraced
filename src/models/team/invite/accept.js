import createUser from "../../user/create";
import { addUserToProject } from "../../project/access";
import getInvite from "./get";
import deleteInvite from "./delete";

export default function acceptInvite(inviteId, hashedPw) {
  return new Promise((resolve, reject) => {
    let user;
    let invite;
    getInvite(inviteId)
      .then((i) => {
        invite = i;
        return createUser({
          email: invite.email,
          hashedPassword: hashedPw,
        });
      })
      .then((u) => {
        user = u;
        return addUserToProject(invite.project_id, user.id);
      })
      .then(() => {
        return deleteInvite(inviteId);
      })
      .then(() => {
        resolve(user);
      })
      .catch(reject);
  });
}
