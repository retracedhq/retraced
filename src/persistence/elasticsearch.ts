import "source-map-support/register";
import * as elasticsearch from "elasticsearch";
import * as _ from "lodash";
import { Scope } from "../security/scope";

let es;

export default function getElasticsearch() {
  if (!es) {
    const hosts = _.split(process.env.ELASTICSEARCH_NODES, ",");
    es = new elasticsearch.Client({ hosts });
  }

  return es;
}

// Get the index string for a projectId and environmentId and any filters
// needed to restrict viewer and enterprise clients to authorized data.
export function scope(scope: Scope): [string, any[]] {
  const index = `retraced.${scope.projectId}.${scope.environmentId}`;
  const filters: any[] = [];

  if (scope.groupId) {
    filters.push({
      bool: {
        should: [
          { term: { "group.id": scope.groupId }},
          { term: { team_id: scope.groupId }},
        ],
      },
    });
  }

  if (scope.targetId) {
    filters.push({
      bool: {
        term: { "target.id": scope.targetId },
      },
    });
  }

  return [index, filters];
}
