import "source-map-support/register";
import elasticsearch from "elasticsearch";
import _ from "lodash";
import request from "request-promise";
import { readFileSync } from "fs";
import config from '../../config';

let es: elasticsearch.Client;

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

    es = new elasticsearch.Client(
      {
        hosts,
        apiVersion: "7.x",
        ssl: sslSettings,
      },
    );
  }

  return es;
}

export interface AliasDesc {
  index: string;
  alias: string;
}

export async function putAliases(toAdd: AliasDesc[], toRemove: AliasDesc[]) {
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
  const params: request.CoreOptions = {
    json: true,
    body: payload,
    insecure: true,
    rejectUnauthorized: false,
    strictSSL: false,
  };

  if (config.ELASTICSEARCH_CAFILE) {
    params.ca = readFileSync(config.ELASTICSEARCH_CAFILE);
  }

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  return await request.post(uri, params);
}
