import * as uuid from "uuid";
import * as moment from "moment";

import getPgPool from "../../persistence/pg";
import nsq from "../../persistence/nsq";

const pgPool = getPgPool();

/**
 * Invite a new member to the group.
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.email] The email address to invite
 * @param {string} [opts.project_id] The project ID to invite the user to
 */
export default function createInvite(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      if (err) {
        reject(err);
        return;
      }

      const invite = {
        id: uuid.v4().replace(/-/g, ""),
        project_id: opts.project_id,
        created: moment().valueOf(),
        email: opts.email,
      };

      const q = `insert into invite (
        id, project_id, created, email
      ) values (
        $1, $2, to_timestamp($3::double precision / 1000), $4
      )`;
      const v = [
        invite.id,
        invite.project_id,
        invite.created,
        invite.email,
      ];

      pg.query(q, v, (qerr, qresult) => {
        done();
        if (qerr) {
          console.log(qerr);
          reject(qerr);
          return;
        }

        // Send the email
        nsq.produce("emails", {
          to: invite.email,
          subject: "You have been invited to join a group on Retraced.",
          template: "retraced/invite-to-team",
          context: {
            invite_url: `${process.env.RETRACED_APP_BASE}/invitations/${invite.id}`,
          },
        });

        resolve();
      });
    });
  });
}
