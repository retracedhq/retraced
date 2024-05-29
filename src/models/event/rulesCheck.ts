import ruler from "ruler";

export interface Options {
  rule: any;
  event: object;
}

export default function eventRulesCheck(opts: Options): boolean {
  let rule: any;
  try {
    if (typeof opts.rule === "string") {
      rule = JSON.parse(opts.rule);
    } else {
      rule = opts.rule;
    }
  } catch (e) {
    rule = opts.rule;
  }
  const engine = ruler(rule);
  return engine.test(opts.event);
}
