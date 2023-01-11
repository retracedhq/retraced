// import elasticsearch from "elasticsearch";
import _ from "lodash";
import moment from "moment";
import axios from "axios";
import https from "https";
import { readFileSync } from "fs";
import config from "../../config";
import { Client } from "@elastic/elasticsearch";

// let es: elasticsearch.Client;
let newEs: Client;

export function getNewElasticsearch(): Client {
  if (!newEs) {
    const hosts = _.split(config.ELASTICSEARCH_NODES || "", ",");
    if ((config.ELASTICSEARCH_NODES || "") !== "") {
      const sslSettings: any = {};
      if (config.ELASTICSEARCH_CAFILE) {
        sslSettings.ca = readFileSync(config.ELASTICSEARCH_CAFILE);
        sslSettings.rejectUnauthorized = true;
      }

      newEs = new Client({
        nodes: hosts,
        ssl: sslSettings,
        maxRetries: 5,
      });
    }
  }
  return newEs;
}

// see api for documentation
const requestRetries = intFromEnv("ELASTICSEARCH_REQUEST_RETRIES", 1);
const requestTimeout = intFromEnv("ELASTICSEARCH_REQUEST_TIMEOUT", 15000);
const backoff = intFromEnv("ELASTICSEARCH_BACKOFF", 1000);
const totalTimeout = intFromEnv("ELASTICSEARCH_TOTAL_TIMEOUT", 25000);

function intFromEnv(key, defaultN) {
  const env = Number(config[key]);

  return _.isNaN(env) ? defaultN : env;
}

// export default function getElasticsearch(): elasticsearch.Client {
//   if (!es) {
//     const hosts = _.split(config.ELASTICSEARCH_NODES || "", ",");
//     if (hosts.length < 1 || !hosts[0]) {
//       throw new Error("Need at least one item in ELASTICSEARCH_NODES");
//     }

//     const sslSettings: any = {};
//     if (config.ELASTICSEARCH_CAFILE) {
//       sslSettings.ca = readFileSync(config.ELASTICSEARCH_CAFILE);
//       sslSettings.rejectUnauthorized = true;
//     }

//     es = new elasticsearch.Client({
//       hosts,
//       requestTimeout,
//       maxRetries: requestRetries,
//       ssl: sslSettings,
//     });
//   }

//   function withRetry(fn) {
//     const action = async (params: any, tries = 0, timeout = totalTimeout) => {
//       const start = moment().valueOf();

//       try {
//         return await fn(params);
//       } catch (err) {
//         const elapsed = moment().valueOf() - start;
//         const delay = backoff * Math.pow(2, tries);
//         const remaining = timeout - elapsed;

//         if (remaining > delay && shouldRetry(err)) {
//           await wait(delay);
//           return await action(params, tries + 1, remaining - delay);
//         }
//         throw err;
//       }
//     };

//     return action;
//   }

//   return Object.assign({}, es, {
//     index: withRetry((params) => es.index(params)),
//   });
// }

// sleep for ms
async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// Return true iff it's possible a request could succeed if retried.
// Connection errors won't have a status.
function shouldRetry(err) {
  if (_.isNumber(err.status) && err.status < 500) {
    return false;
  }
  return true;
}

export interface AliasDesc {
  index: string;
  alias: string;
}

export type AliasRotator = (toAdd: AliasDesc[], toRemove: AliasDesc[]) => Promise<any>;

export async function putAliases(toAdd: AliasDesc[], toRemove: AliasDesc[]): Promise<any> {
  const payload = {
    actions: [
      ...toAdd.map((v) => ({ add: { index: v.index, alias: v.alias } })),
      ...toRemove.map((v) => ({ remove: { index: v.index, alias: v.alias } })),
    ],
  };

  const hosts = _.split(config.ELASTICSEARCH_NODES || "", ",");
  if (hosts.length < 1 || !hosts[0]) {
    throw new Error("Need at least one item in ELASTICSEARCH_NODES");
  }
  const uri = `${hosts[0]}/_aliases`;
  const httpsAgentParams: https.AgentOptions = {
    rejectUnauthorized: false,
  };

  if (config.ELASTICSEARCH_CAFILE) {
    httpsAgentParams.ca = readFileSync(config.ELASTICSEARCH_CAFILE);
  }

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

  const { data } = await axios.post<any>(uri, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    httpsAgent: new https.Agent(httpsAgentParams),
  });

  return data;
}
