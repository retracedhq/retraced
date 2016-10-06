'use strict';

const uuid = require('uuid');
const mandrill = require('mandrill-api/mandrill');

const pgPool = require('../../persistence/pg')();
const config = require('../../config/getConfig')();

/**
 * Invite a new member to the team.
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.email] The email address to invite
 * @param {string} [opts.project_id] The project ID to invite the user to
 */
function createInvite(opts) {
  return new Promise((resolve, reject) => {
    pgPool.connect((err, pg, done) => {
      const invite = {
        id: uuid.v4().replace(/-/g, ''),
        project_id: opts.project_id,
        created: new Date().getTime(),
        email: opts.email,
      };

      const q = `insert into invite (
        id, project_id, created, email
      ) values (
        $1, $2, to_timestamp($3), $4
      )`;
      const v = [
        invite.id,
        invite.project_id,
        invite.created,
        invite.email,
      ];

      console.log('a');
      pg.query(q, v, (qerr, qresult) => {
        done(true);
        if (qerr) {
          reject(qerr);
          return;
        }

        console.log('b');
        // Send the email
        // TODO this should be async in a queue
        const mandrillClient = new mandrill.Mandrill(config.Mandrill.APIKey);
        const templateName = 'retraced/invite-to-team';
        const templateContent = [];
        const mergeVars = [{
          name: 'invite_url',
          content: `${config.URLs.RetracedAppBase}/invite?id=${invite.id}`,
        }];

        console.log(mergeVars);
        const params = {
          template_name: templateName,
          template_content: templateContent,
        };
        console.log(params);
        mandrillClient.templates.render(params, (rendered) => {
          console.log('blargh');
          const moreParams = {
            message: {
              html: rendered.html,
              to: [{
                email: invite.email,
                type: 'to',
              }],
              from_email: 'contact@auditable.io',
              from_name: 'Retraced',
              subject: 'You are invited to join a team on Retraced',
              global_merge_vars: mergeVars,
            },
            async: false,
          };
          mandrillClient.messages.send(moreParams,
            (result) => {
              console.log('c');
              resolve(invite);
            },
            (merr) => {
              console.log('Error sending invite email: ', merr);
              reject(merr);
            }
          );
        });
      });
    });
  });
}

module.exports = createInvite;
