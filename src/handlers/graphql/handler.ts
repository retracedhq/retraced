import "source-map-support/register";

import schema from "./schema";
import { graphql } from "graphql";

export interface Context {
  projectId: string;
  environmentId: string;
  admin: boolean;
  groupIds?: string[];
  targetIds?: string[];
}
export default async function(req, context: Context) {
  const query = req.body.query || req.query.query;
  const op = req.body.operationName || req.query.operationName;
  const vars = req.body.variables || req.query.variables;
  const result = await graphql(schema, query, null, context, vars, op);

  if (result.errors) {
    return {
      status: 400,
      body: JSON.stringify(result),
    };
  }

  return {
    status: 200,
    body: JSON.stringify(result),
  };
}
