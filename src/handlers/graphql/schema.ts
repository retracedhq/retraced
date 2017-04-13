import * as moment from "moment";
import {
  GraphQLSchema,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLList,
} from "graphql";

import search from "./search";

const targetType = new GraphQLObjectType({
  name: "Target",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "A unique id representing this target.",
    },
    name: {
      type: GraphQLString,
      description: "The name of this target.",
    },
    href: {
      type: GraphQLString,
    },
    type: {
      type: GraphQLString,
    },
  }),
});

const actorType = new GraphQLObjectType({
  name: "Actor",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "A unique id representing this actor.",
    },
    name: {
      type: GraphQLString,
      description: "The name of this actor.",
    },
    href: {
      type: GraphQLString,
    },
  }),
});

const groupType = new GraphQLObjectType({
  name: "Group",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "A unique id representing this group.",
    },
    name: {
      type: GraphQLString,
      description: "The name of this group.",
    },
  }),
});

const eventType = new GraphQLObjectType({
  name: "Event",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "A unique id representing this event.",
    },

    action: {
      type: GraphQLString,
      description: "The action that was taken to generate this event.",
    },

    description: {
      type: GraphQLString,
      description: "The description of the event that was taken.",
    },

    group: {
      type: groupType,
    },

    actor: {
      type: actorType,
    },

    target: {
      type: targetType,
    },

    crud: {
      type: new GraphQLEnumType({
        name: "CRUD",
        values: {
          c: {
            value: "c",
            description: "create",
          },
          r: {
            value: "r",
            description: "read",
          },
          u: {
            value: "u",
            description: "update",
          },
          d: {
            value: "d",
            description: "delete",
          },
        },
      }),
    },

    display_title: {
      type: GraphQLString,
      description: "The display title for this event.",
    },

    received: {
      type: GraphQLString,
      description: "The time that the Retraced API received this event.",
      resolve: ({ received }) => received && moment.utc(received).format(),
    },

    created: {
      type: GraphQLString,
      description: "The time that the event was reported as performed.",
      resolve: ({ created }) => created && moment.utc(created).format(),
    },

    is_failure: {
      type: GraphQLBoolean,
      description: "Set to true if the event represents a failed use of permissions.",
    },

    is_anonymous: {
      type: GraphQLBoolean,
      description: "Set to true if the user was not logged in when performing this action.",
    },

    source_ip: {
      type: GraphQLString,
      description: "The IP address of the actor when the action was performed.",
    },

    country: {
      type: GraphQLString,
      description: "The country that the actor was in when the action was performed.",
    },

    loc_subdiv1: {
      type: GraphQLString,
      description: "The large area of the country the actor was in when the action was performed (State).",
    },

    loc_subdiv2: {
      type: GraphQLString,
      description: "The granular area of the country the actor was in when the action was performed (City).",
    },

    // GraphQL does not have a map type. Fields is a list of key-value objects.
    fields: {
      type: new GraphQLList(new GraphQLObjectType({
        name: "Field",
        fields: () => ({
          key: {
            type: GraphQLString,
          },
          value: {
            type: GraphQLString,
          },
        }),
      })),
    },
  }),
});

const queryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    search: {
      type: new GraphQLObjectType({
        name: "EventsConnection",
        fields: {
          edges: {
            type: new GraphQLList(new GraphQLObjectType({
              name: "EventEdge",
              fields: {
                node: {
                  type: eventType,
                },
                cursor: {
                  type: GraphQLString,
                },
              },
            })),
          },
          pageInfo: {
            type: new GraphQLObjectType({
              name: "PageInfo",
              fields: {
                hasNextPage: {
                  type: GraphQLBoolean,
                  description: "Indicates there are newer events matching the query when paging from oldest to newest.",
                },
                hasPreviousPage: {
                  type: GraphQLBoolean,
                  description: "Indicates there are older events matching the query when paging from newest to oldest.",
                },
              },
            }),
          },
          totalCount: {
            type: GraphQLInt,
          },
        },
      }),
      args: {
        query: {
          type: GraphQLString,
          description: "The operators used to filter events.",
        },
        first: {
          type: GraphQLInt,
          description: "Limit of events to return, sorted from oldest to newest",
        },
        after: {
          type: GraphQLString,
          description: "An cursor returned from a previous query.",
        },
        last: {
          type: GraphQLInt,
          description: "Limit of events to return, sorted from newest to oldest",
        },
        before: {
          type: GraphQLString,
          description: "A cursor returned from a previous query.",
        },
      },
      resolve: search,
    },
  },
});

export default new GraphQLSchema({
  query: queryType,
});
