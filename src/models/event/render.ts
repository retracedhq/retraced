import * as Handlebars from "handlebars";

export interface Options {
  event: Object;
  template: string;
  source: string;
}

export default function renderEvent(opts: Options): string {
  return Handlebars.compile(opts.template)(opts.event);
}
