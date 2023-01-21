export const CreateEventSchema = {
  $schema: "http://json-schema.org/draft-04/schema#",
  definitions: {
    id: {
      type: "string",
    },
    name: {
      type: "string",
    },
  },
  properties: {
    action: {
      type: "string",
    },
    group: {
      properties: {
        id: {
          $ref: "#/definitions/id",
        },
        name: {
          $ref: "#/definitions/name",
        },
      },
      required: ["id", "name"],
      type: "object",
    },
    actor: {
      properties: {
        href: {
          type: "string",
        },
        id: {
          $ref: "#/definitions/id",
        },
        name: {
          $ref: "#/definitions/name",
        },
        fields: {
          type: "object",
        },
      },
      required: ["id"],
      type: "object",
    },
    created: {
      type: "object",
    },
    crud: {
      type: "string",
      enum: ["c", "r", "u", "d"],
    },
    description: {
      type: "string",
    },
    source_ip: {
      type: "string",
    },
    target: {
      properties: {
        href: {
          type: "string",
        },
        id: {
          $ref: "#/definitions/id",
        },
        name: {
          $ref: "#/definitions/name",
        },
        type: {
          type: "string",
        },
        fields: {
          type: "object",
        },
      },
      required: ["id"],
      type: "object",
    },
    is_anonymous: {
      type: "boolean",
    },
    is_failure: {
      type: "boolean",
    },
    component: {
      type: "string",
    },
    version: {
      type: "string",
    },
    fields: {
      type: "object",
    },
  },
  required: ["action", "crud"],
  additionalProperties: false,
  type: "object",
};

export const search = (q: string) => {
  return {
    variables: { query: q, last: 20, before: "" },
    query: GraphQLQuery.query,
  };
};

export const GraphQLQuery = {
  variables: { query: "", last: 20, before: "" },
  query: `
    query Search($query: String!, $last: Int, $before: String) {
    search(query: $query, last: $last, before: $before) {
        totalCount
        pageInfo {
            hasPreviousPage
        }
        edges {
            cursor
            node {
                id
                action
                crud
                created
                received
                canonical_time
                description
                actor {
                    id
                    name
                    href
                    fields {
                        key
                        value
                    }
                }
                group {
                    id
                    name
                }
                target {
                    id
                    name
                    href
                    type
                    fields {
                        key
                        value
                    }
                }
                display {
                    markdown
                }
                is_failure
                is_anonymous
                source_ip
                country
                loc_subdiv1
                loc_subdiv2
                fields {
                    key
                    value
                }
            }
        }
    }
}`,
};
