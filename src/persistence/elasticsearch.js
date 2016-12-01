import * as elasticsearch from "elasticsearch";
import * as _ from "lodash";

import getConfig from "../config/getConfig";

const config = getConfig();

let es;

export default function getElasticsearch() {
  if (!es) {
    const c = config.Elasticsearch;
    const hosts = _.map(c.Endpoints, (e) => {
      return `${c.Protocol}://${c.User}:${c.Password}@${e}:${c.Port}/`;
    });
    es = new elasticsearch.Client({ hosts });
  }

  return es;
}
