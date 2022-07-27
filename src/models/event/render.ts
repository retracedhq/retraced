import Handlebars from "handlebars";

export interface Options {
  event: object;
  template: string;
  source: string;
}

export default function renderEvent(opts: Options): string {
  return Handlebars.compile(opts.template)(opts.event);
}
