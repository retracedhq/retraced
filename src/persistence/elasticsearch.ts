import _ from "lodash";
import moment from "moment";
import { Scope } from "../security/scope";
import { Client } from "@opensearch-project/opensearch";
import axios from "axios";
import { readFileSync } from "fs";
import config from "../config";
import https from "https";

// let es: elasticsearch.Client; // the legacy elasticsearch client library
let es: Client;

/*
 * The Elasticsearch client library does not retry requests that failed due to
 * all connections in the pool being dead. If it retries a request, it will
 * retry it continually until maxRetries or requestTimeout limits are reached.
 * It does not implement any backoff between retries. It does not retry 500
 * status requests.
 *
 * Our wrapper around the search function retries requests with exponential
 * backoff. It retries dead-connection requests since the ES server may be
 * restarting. It only has a timeout, no max retries limit. It retries requests
 * with a status code in the 500 range.
 */

// backoff is the initial backoff after the first failure by the ES client lib.
// It's used by our wrapper, not passed to the ES client lib.
const backoff = intFromEnv("ELASTICSEARCH_BACKOFF", 1000);

// totalTimeout is for all requests and retries with backoffs. Outstanding
// requests will not be interrupted. Used only by our wrapper.
const totalTimeout = intFromEnv("ELASTICSEARCH_TOTAL_TIMEOUT", 25000);

function intFromEnv(key, defaultN) {
  const env = Number(config[key]);

  return _.isNaN(env) ? defaultN : env;
}

function getElasticsearch(noRetry = false): Client {
  if (!es) {
    const hosts = _.split(config.ELASTICSEARCH_NODES || "", ",");
    if ((config.ELASTICSEARCH_NODES || "") !== "") {
      const sslSettings: any = {};
      if (config.ELASTICSEARCH_CAFILE) {
        sslSettings.ca = readFileSync(config.ELASTICSEARCH_CAFILE);
        sslSettings.rejectUnauthorized = true;
      }

      es = new Client({
        nodes: hosts,
        ssl: sslSettings,
        maxRetries: 5,
      });
    }
  }

  if (noRetry) {
    return es;
  }

  function withRetry(fn) {
    const action = async (params: any, tries = 0, timeout = totalTimeout) => {
      const start = moment().valueOf();

      try {
        return await fn(params);
      } catch (err) {
        const elapsed = moment().valueOf() - start;
        const delay = backoff * Math.pow(2, tries);
        const remaining = timeout - elapsed;

        if (remaining > delay && shouldRetry(err)) {
          await wait(delay);
          return await action(params, tries + 1, remaining - delay);
        }
        throw err;
      }
    };

    return action;
  }

  return Object.assign({}, es, {
    count: es.count,
    index: withRetry((params) => es.index(params)),
    search: withRetry((params) => es.search(params)),
    scroll: withRetry((params) => es.scroll(params)),
    indices: Object.assign({}, es.indices, {
      create: withRetry((params) => es.indices.create(params)),
    }),
  });
}

export type ClientWithRetry = {
  count: any;
  index: any;
  search: any;
  scroll: any;
  indices: {
    create: any;
  };
};

export function getESWithRetry(): ClientWithRetry {
  return getElasticsearch();
}

export function getESWithoutRetry(): Client {
  return getElasticsearch(true);
}

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

// Get the index string for a projectId and environmentId and any filters
// needed to restrict viewer and enterprise clients to authorized data.
export function scope(scopeInfo: Scope): [string, any[]] {
  const index = `retraced.${scopeInfo.projectId}.${scopeInfo.environmentId}.current`;
  const filters: any[] = [];

  if (scopeInfo.groupId) {
    filters.push({
      bool: {
        should: [
          {
            match: {
              "group.id": { query: scopeInfo.groupId, operator: "and" },
            },
          },
          { match: { team_id: { query: scopeInfo.groupId, operator: "and" } } },
        ],
      },
    });
  }

  if (scopeInfo.targetId) {
    filters.push({
      match: { "target.id": { query: scopeInfo.targetId, operator: "and" } },
    });
  }

  return [index, filters];
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
