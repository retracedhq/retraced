import elasticsearch from "elasticsearch";
import _ from "lodash";
import axios from "axios";
import { readFileSync } from "fs";
import config from "../../config";
import https from "https";
import { Client } from "@elastic/elasticsearch";

let es: elasticsearch.Client;
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

export default function getElasticsearch(): elasticsearch.Client {
  if (!es) {
    const hosts = _.split(config.ELASTICSEARCH_NODES || "", ",");
    if (hosts.length < 1 || !hosts[0]) {
      throw new Error("Need at least one item in ELASTICSEARCH_NODES");
    }

    const sslSettings: any = {};
    if (config.ELASTICSEARCH_CAFILE) {
      sslSettings.ca = readFileSync(config.ELASTICSEARCH_CAFILE);
      sslSettings.rejectUnauthorized = true;
    }

    es = new elasticsearch.Client({
      hosts,
      apiVersion: "7.x",
      ssl: sslSettings,
    });
  }

  return es;
}

export interface AliasDesc {
  index: string;
  alias: string;
}

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
