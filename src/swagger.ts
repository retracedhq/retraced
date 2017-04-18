// tslint:disable-next-line
import * as util from "util";
import * as publisherApi from "./swagger.json";

const apiHost = process.env.RETRACED_API_BASE || "localhost:3000";

function fix(json: any): void {
  json.host = apiHost;
  // delete json.definitions.Fields.required;
}

fix(publisherApi);

export { publisherApi };
