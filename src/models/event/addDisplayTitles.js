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
 * @param {string} [opts.source] The source (viewer or admin)
 */
export default async function addDisplayTitles(opts) {
  // Get all actions we need in a single database query
  const actions = await listActions({
    project_id: opts.project_id,
    environment_id: opts.environment_id,
  });

  const updated = _.map(opts.events, (event) => {
    // If the action has an display template, use that
    let action = _.find(actions, ["action", event.action]);
    if (action && action.display_template) {
      event.display_title = buildDisplay(action.display_template, event, opts.project_id, opts.environment_id, opt.source);
    } else if (event.actor && event.actor.name) {
      let actorTemplate;
      if (opts.source === "viewer") {
        if (event.actor.url) {
          actorTemplate = `[**${event.actor.name}**](${event.actor.url})`;
        } else {
          actorTemplate = `**${event.actor.name}**`;
        }
      } else {
        actorTemplate = `[**${event.actor.name}**](/project/${opts.project_id}/actor/${event.actor.id})`;
      }

      if (event.target) {
        let targetTemplate;
        if (opts.source === "viewer") {
          if (event.target.url) {
            targetTemplate = `[**${event.target.name}**](${event.target.url})`;
          } else {
            targetTemplate = `**${event.target.name}**`;
          }
        } else {
          targetTemplate = `[**${event.target.name}**](/project/${opts.project_id}/target/${event.target.id})`;
        }
        event.display_title = `${actorTemplate} performed the action **${event.action}** on ${targetTemplate}`;
      } else {
        event.display_title = `${actorTemplate} performed the action **${event.action}**`;
      }
    } else {
      event.display_title = event.action;
    }
    return event;
  });

  return updated;
}

function buildDisplay(template, event, projectId, environmentId, source) {
  let data = event;

  Handlebars.registerHelper("actor", () => {
    if (source === "viewer") {
      if (this.actor.url) {
        return `[**${this.actor.name}**](${this.actor.url})`;
      } else {
        return `**${this.actor.name}**`;
      }
    }

    return `[**${this.actor.name}**](/project/${projectId}/actor/${this.actor.id})`;
  });
  Handlebars.registerHelper("target", () => {
    if (!this.target) {
      return "*unknown*";
    }
    if (soruce === "viewer") {
      if (this.target.url) {
        return `[**${this.target.name}**](${this.target.url})`;
      } else {
        return `**${this.target.name}**`;
      }
    }

    return `[**${this.target.name}**](/project/${projectId}/target/${this.target.id})`;
  });

  Handlebars.registerHelper("retracedUrl", (o) => {
    if (_.has(o, "retraced_object_type")) {
      switch (o.retraced_object_type) {
        case "actor":
          return `/project/${projectId}/actor/${o.id}`;
        case "target":
          return `/project/${projectId}/target/${o.id}`;
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
