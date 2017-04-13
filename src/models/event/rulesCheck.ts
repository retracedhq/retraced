import * as _ from "lodash";
import * as ruler from "ruler";

export interface Options {
  rule: any;
  event: Object;
}

export default function eventRulesCheck(opts: Options): boolean {
  const engine = ruler(opts.rule);
  return engine.test(opts.event);
}
