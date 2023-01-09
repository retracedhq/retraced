import { Scope } from "../../security/scope";
import schema from "./schema";
import { graphql } from "graphql";

export default async function (req, context: Scope) {
  const query = req.body.query || req.query.query;
  const op = req.body.operationName || req.query.operationName;
  const vars = req.body.variables || req.query.variables;
  const result = await graphql({
    schema,
    source: query,
    rootValue: null,
    contextValue: context,
    variableValues: vars,
    operationName: op,
  });

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
