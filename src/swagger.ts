import * as _ from "lodash";
import * as compositeSpec from "./swagger.json";

const apiHost: string = process.env.RETRACED_API_BASE || "localhost:3000";
const apiSchemes: string = process.env.RETRACED_API_SCHEMES || "http,https";

// exported for testing
export interface ApiSpec {
  match: RegExp;
  path: string;
  title: string;
  description: string;
  swagger?: any;
}

const specs: ApiSpec[] = [
  {
    match: /^\/publisher\/v1/,
    path: "/publisher/v1",
    title: "Publisher API",
    description: "APIs for vendor integration with the Retraced Platform",
  },
  {
    match: /^\/admin\/v1/,
    path: "/admin/v1",
    title: "Admin API",
    description: "APIs used by the [Retraced Admin Site](https://app.retraced.io)",
  },
  {
    match: /^\/enterprise\/v1/,
    path: "/enterprise/v1",
    title: "Enterprise API",
    description: "Retraced's Enteriprise IT Integration API, allowing end customers to ingest and export audit data",
  },
];

function fix(json: any, schemes: string[]): void {
  json.host = apiHost;
  json.schemes = schemes;
  json.basePath = "";
  removeEmptyRequired(json);
}

function removeEmptyRequired(json: any) {
  json.definitions = _.mapValues(json.definitions, (def) => {
    if (_.isEmpty(def.required)) {
      _.unset(def, "required");
    }
    return def;
  });

}

// exported for testing
export function removeRoutesNotMatching(json: any, pattern: RegExp) {
  for (const path of Object.keys(json.paths)) {
    if (!path.match(pattern)) {
      _.unset(json.paths, path);
    }
  }
}

/**
 * Take all the `ApiSpec`s
 *
 *     -
 *     - remove routes not matching `match` from a copy of the swagger spec
 *     - set the result swagger spec as `swagger` on the api
 *
 * Its kind of weird that we have to do this. I think its a consequence
 * of having 4 apis in one repo/runtime.
 *
 *
 * exported for testing
 */
export function filterAndAssign(json: any, apis: ApiSpec[]) {
  return apis.map((api) => {
    const swaggerCopy = _.cloneDeep(json);
    removeRoutesNotMatching(swaggerCopy, api.match);
    if (!swaggerCopy.info) {
      swaggerCopy.info = {};
    }
    swaggerCopy.info.description = api.description;
    swaggerCopy.info.title = api.title;
    api.swagger = swaggerCopy;
    return api;
  });
}

fix(compositeSpec, apiSchemes.split(","));
filterAndAssign(compositeSpec, specs);

export default specs;
