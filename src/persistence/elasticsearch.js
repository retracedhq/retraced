import "source-map-support/register";
import * as elasticsearch from "elasticsearch";
import * as _ from "lodash";

let es;

export default function getElasticsearch() {
  if (!es) {
    const hosts = _.split(process.env.ELASTICSEARCH_NODES, ",");
    es = new elasticsearch.Client({ hosts });
  }

  return es;
}
