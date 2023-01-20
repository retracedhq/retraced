import listTemplates from "../template/list";
import rulesCheck from "../event/rulesCheck";
import renderEvent from "../event/render";

export interface Options {
  projectId: string;
  environmentId: string;
  events: any[];
  source: "viewer" | "admin";
}

export default async function addDisplayTitles(opts: Options): Promise<any[]> {
  const templates = await listTemplates({
    environmentId: opts.environmentId,
  });

  const updated = opts.events.map((event) => {
    let markdown = "";
    let templateIdx = 0;
    while (markdown === "" && templateIdx < templates.templates.length) {
      if (rulesCheck({ rule: templates.templates[templateIdx].rule, event })) {
        markdown = renderEvent({
          event,
          template: templates.templates[templateIdx].template,
          source: "",
        });
      }
      templateIdx++;
    }

    if (markdown === "") {
      // Use the default
      markdown = renderEvent({
        event,
        template: getDefaultMarkdownForEvent(event),
        source: "",
      });
    }

    event.display = {
      markdown,
    };

    return event;
  });

  return updated;
}

function getDefaultMarkdownForEvent(event): string {
  let markdown = "";
  if (event.actor.name) {
    markdown = markdown + "**{{actor.name}}**";
  } else {
    markdown = markdown + "**An unknown actor**";
  }

  markdown = markdown + " performed the action **{{action}}**";

  if (event.target && event.target.name) {
    markdown = markdown + " on the item **{{target.name}}**";
  }

  markdown = markdown + ".";

  return markdown;
}
