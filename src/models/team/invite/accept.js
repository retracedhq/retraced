

const createUser = require('../../user/create');
const addUserToProject = require('../../project/access').addUserToProject;
const getInvite = require('./get');
const deleteInvite = require('./delete');

function acceptInvite(inviteId, hashedPw) {
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

module.exports = acceptInvite;
