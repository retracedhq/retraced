import { Scope } from "../../security/scope";
import schema from "./schema";
import { GraphQLError, graphql, parse, specifiedRules, validate } from "graphql";

export default async function (req, context: Scope) {
  const query = req.body.query || req.query.query;
  const op = req.body.operationName || req.query.operationName;
  const vars = req.body.variables || req.query.variables;
  const errors = validateQuery(query, schema);
  if (errors.length > 0) {
    return {
      status: 400,
      body: JSON.stringify(errors),
    };
  }
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
  const fields = new Set<string>();
  let fieldParent = "";
  return {
    Field: (node) => {
      const type = context.getParentType();
      const fieldDef = context.getFieldDef();
      const field =
        `${
          fieldParent && type.name === "Field" && (fieldDef.name === "key" || fieldDef.name === "value")
            ? fieldParent + ":"
            : ""
        }` +
        type +
        ":" +
        fieldDef.name;
      if (fieldDef.name === "fields") {
        fieldParent = type.name;
      }
      if (fieldDef.name === "metadata") {
        fieldParent = type.name + ":" + "Metadata";
      }
      if (fields[field]) {
        context.reportError(new Error(`Duplicate field ${field}.`));
        return;
      }
      fields[field] = true;
    },
  };
}

/**
 *
 * Reference: https://stackoverflow.com/questions/58859146/graphql-requesting-fields-that-dont-exist-without-error
 */
export function validateQuery(query: string, gqlSchame: any): GraphQLError[] {
  const validationRules = [...specifiedRules, NoDuplicateFields];
  const documentAST = parse(query);
  const errors = validate(gqlSchame, documentAST, validationRules);
  return [...errors];
}
