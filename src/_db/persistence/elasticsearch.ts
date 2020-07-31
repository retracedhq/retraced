import "source-map-support/register";
import * as elasticsearch from "elasticsearch";
import * as _ from "lodash";
import * as request from "request-promise";

let es: elasticsearch.Client;

export default function getElasticsearch() : elasticsearch.Client {
  if (!es) {
    const hosts = _.split(process.env.ELASTICSEARCH_NODES || "", ",");
    if (hosts.length < 1 || !hosts[0]) {
      throw new Error("Need at least one item in ELASTICSEARCH_NODES");
    }
    es = new elasticsearch.Client(
      {
        hosts,
        apiVersion: "7.x",
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

  const hosts = _.split(process.env.ELASTICSEARCH_NODES || "", ",");
  if (hosts.length < 1 || !hosts[0]) {
    throw new Error("Need at least one item in ELASTICSEARCH_NODES");
  }
  const uri = `${hosts[0]}/_aliases`;
  const params = {
    json: true,
    body: payload,
    insecure: true,
    rejectUnauthorized: false,
    strictSSL: false,
  };
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
  return await request.post(uri, params);
}
