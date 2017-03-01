import * as _ from "lodash";
import * as Handlebars from "handlebars";

import listActions from "../action/list";

export interface Options {
  projectId: string;
  environmentId: string;
  events: any[];
  source: "viewer" | "admin";
}

export default async function addDisplayTitles(opts: Options): Promise<any[]> {
  const actions = await listActions({
    projectId: opts.projectId,
    environmentId: opts.environmentId,
  });

  const updated = opts.events.map((event) => {
    const action: any = _.find(actions, ["action", event.action]);
    if (action && action.displayTemplate) {
      event.displayTitle = buildDisplay(action.displayTemplate, event, opts.projectId, opts.environmentId, opts.source);
    } else if (event.actor && event.actor.name) {
      let actorTemplate;
      if (opts.source === "viewer") {
        if (event.actor.url) {
          actorTemplate = `[**${event.actor.name}**](${event.actor.url})`;
        } else {
          actorTemplate = `**${event.actor.name}**`;
        }
      } else {
        actorTemplate = `[**${event.actor.name}**](/project/${opts.projectId}/actor/${event.actor.id})`;
      }

      if (event.target && event.target.id) {
        let targetTemplate;
        if (opts.source === "viewer") {
          if (event.target.url) {
            targetTemplate = `[**${event.target.name}**](${event.target.url})`;
          } else {
            targetTemplate = `**${event.target.name}**`;
          }
        } else {
          targetTemplate = `[**${event.target.name}**](/project/${opts.projectId}/target/${event.target.id})`;
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
    if (source === "viewer") {
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
