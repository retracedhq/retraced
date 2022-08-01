import "source-map-support/register";
import elasticsearch from "elasticsearch";
import _ from "lodash";
import moment from "moment";
import { Scope } from "../security/scope";
import { Client } from "@elastic/elasticsearch";
import { readFileSync } from "fs";
import config from "../config";

let es: elasticsearch.Client; // the legacy elasticsearch client library
let newEs: Client; // the elasticsearch 7.6+ client library

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

// requestRetries specifies how many times the ES client library will retry.
// It retries without backoff so set it to a low number. The only errors the ES
// client library retries are errors emitted by Node's standard library http[s]
// module.
const requestRetries = intFromEnv("ELASTICSEARCH_REQUEST_RETRIES", 1);

// requestTimeout specifies how long the ES client library will wait for a
// request including retries. Set it high so actual long-running requests
// are not interrupted. Most requests will hit requestRetries limit before
// this timeout.
const requestTimeout = intFromEnv("ELASTICSEARCH_REQUEST_TIMEOUT", 15000);

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

export default function getElasticsearch(): elasticsearch.Client {
  if (!es) {
    const hosts = _.split(config.ELASTICSEARCH_NODES || "", ",");

    const sslSettings: any = {};
    if (config.ELASTICSEARCH_CAFILE) {
      sslSettings.ca = readFileSync(config.ELASTICSEARCH_CAFILE);
      sslSettings.rejectUnauthorized = true;
    }

    es = new elasticsearch.Client({
      hosts,
      requestTimeout,
      maxRetries: requestRetries,
      ssl: sslSettings,
    });
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
    raw: es,
    search: withRetry((params) => es.search(params)),
    scroll: withRetry((params) => es.scroll(params)),
    indices: Object.assign({}, es.indices, {
      create: withRetry((params) => es.indices.create(params)),
    }),
  });
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
          { match: { "group.id": { query: scopeInfo.groupId, operator: "and" } }},
          { match: { team_id: { query: scopeInfo.groupId, operator: "and" } }},
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
