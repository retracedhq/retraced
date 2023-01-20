import renderEvent from "../../models/event/render";
import eventRulesCheck from "../../models/event/rulesCheck";

export default function (req) {
  const rule = req.body.rule;
  const template = req.body.template;
  const event = req.body.event;
  const source = req.body.source;

  const rulesOpts = {
    rule,
    event,
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
    event,
    template,
    source,
  };
  const rendered = renderEvent(renderOpts);

  return {
    status: 200,
    body: JSON.stringify({
      match: true,
      rendered,
    }),
  };
}
