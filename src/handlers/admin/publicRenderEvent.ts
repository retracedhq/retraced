import renderEvent from "../../models/event/render";
import eventRulesCheck from "../../models/event/rulesCheck";
import { isStringValidJSON } from "../../util/json";

export default async function (req) {
  const rule = req.body.rule;
  const template = req.body.template;
  const event = req.body.event;
  const source = req.body.source;

  if (!isStringValidJSON(event)) {
    return {
      status: 400,
      body: JSON.stringify({
        error: "Bad Request",
        message: "'event' must be a valid JSON object",
      }),
    };
  }

  const rulesOpts = {
    rule: JSON.parse(rule),
    event: JSON.parse(event),
  };
  const ruleMatch = eventRulesCheck(rulesOpts);
  if (!ruleMatch) {
    return {
      status: 200,
      body: JSON.stringify({
        match: false,
      }),
    };
  }

  const renderOpts = {
    event: JSON.parse(event),
    template,
    source,
  };
  const rendered = await renderEvent(renderOpts);

  return {
    status: 200,
    body: JSON.stringify({
      match: true,
      rendered,
    }),
  };
}
