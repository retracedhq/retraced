import * as _ from "lodash";
import * as Handlebars from "handlebars";

import listActions from "../action/list";

/**
 * addDisplayTitles returns a Promise that does something fun to an array of events.
 *
 * @param {Object} [opts] The request options
 * @param {string} [opts.project_id] The project id to query
 * @param {string} [opts.environment_id] The environment id to query
 * @param {Array} [opts.events] The events to add display titles
 */
export default function addDisplayTitles(opts) {
  return new Promise((resolve, reject) => {
    // Get all actions we need in a single database query
    listActions({
      project_id: opts.project_id,
      environment_id: opts.environment_i,
    })
    .then((actions) => {
      var updated = _.map(opts.events, (event) => {
        // If the action has an display template, use that
        let action = _.find(actions, ["action", event.action]);
        if (action && action.display_template) {
          event.display_title = buildDisplay(action.display_template, event, opts.project_id, opts.environment_id);
        } else if (event.actor && event.actor.name) {
          if (event.object) {
            event.display_title = `[**${event.actor.name}**](/project/${opts.project_id}/actor/${event.actor.id}) performed the action **${event.action}** on [**${event.object.name}**](/project/${opts.project_id}/object/${event.object.id})`;
          } else {
            event.display_title = `[**${event.actor.name}**](/project/${opts.project_id}/actor/${event.actor.id}) performed the action **${event.action}**`;
          }
        } else {
          event.display_title = event.action;
        }
        return event;
      });

      resolve(updated);
    })
    .catch((err) => {
      reject(err);
    });
  });
}

function buildDisplay(template, event, projectId, environmentId) {
  let data = event;

  Handlebars.registerHelper("actor", function(){
    return `[**${this.actor.name}**](/project/${projectId}/actor/${this.actor.id})`;
  });
  Handlebars.registerHelper("object", function(){
    if (!this.object) {
      return "*unknown*";
    }
    return `[**${this.object.name}**](/project/${projectId}/object/${this.object.id})`;
  });

  Handlebars.registerHelper("retracedUrl", (o) => {
    if (_.has(o, "retraced_object_type")) {
      switch (o.retraced_object_type) {
        case "actor":
          return `/project/${projectId}/actor/${o.id}`;
        case "object":
          return `/project/${projectId}/object/${o.id}`;
        default:
          return;
      }
    }

    return;
  });

  Handlebars.registerHelper("sourceUrl", (o) => {
    return o.url;
  });

  return Handlebars.compile(template)(data);
}
