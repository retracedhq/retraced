import "source-map-support/register";

import { Scope } from "../../security/scope";
import schema from "./schema";
import { graphql } from "graphql";
import { specifiedRules } from "graphql/validation";

export default async function(req, context: Scope) {
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

/*
 * Custom validator to disallow duplicate fields in a query.
 * This validator protects against various denial of service attacks:
 * 1. Field duplication
 * 2. Alias attack
 * 3. Deep-recursive queries
 * 4. Circular fragments
 *
 * See https://medium.com/@ibm_ptc_security/denial-of-service-attacks-with-graphql-77189a6ba85b
 */
export function NoDuplicateFields(context) {
    const fields = new Set<String>();
    return {
        Field: (node) => {
            const type = context.getParentType();
            const fieldDef = context.getFieldDef();
            const field = type + ":" + fieldDef.name;
            if (fields[field]) {
                context.reportError(new Error(`Duplicate field ${field}.`));
                return;
              }
            fields[field] = true;
        },
    };
}

specifiedRules.push(NoDuplicateFields);

