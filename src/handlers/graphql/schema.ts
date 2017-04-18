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
  description: "The object an event is performed on.",
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
      description: "The URL associated with this target.",
      type: GraphQLString,
    },
    type: {
      description: "The type of this target entity.",
      type: GraphQLString,
    },
  }),
});

const actorType = new GraphQLObjectType({
  description: "The agent who performed an event.",
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
      description: "The URL associated with this actor.",
      type: GraphQLString,
    },
  }),
});

const groupType = new GraphQLObjectType({
  description: "The group this event is associated with.",
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
  description: "A single record in an audit log.",
  name: "Event",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "A unique id representing this event.",
    },

    action: {
      type: GraphQLString,
      description: "The type of action that was taken to generate this event.",
    },

    description: {
      type: GraphQLString,
      description: "The description of the event that was taken.",
    },

    group: {
      description: "The group associated with this event.",
      type: groupType,
    },

    actor: {
      description: "The actor associated with this event.",
      type: actorType,
    },

    target: {
      description: "The target associated with this event.",
      type: targetType,
    },

    crud: {
      description: "The classification of this event as create, read, update, or delete.",
      type: new GraphQLEnumType({
        description: "Create  | Read | Update | Delete",
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

    display: {
      description: "The display text for this event.",
      type: new GraphQLObjectType({
        name: "Display",
        fields: {
          markdown: {
            type: GraphQLString,
            dsecription: "The Markdown formatted display text for this event.",
          },
        },
      }),
    },

    received: {
      type: GraphQLString,
      description: "The time that the Retraced API received this event.",
      resolve: ({ received }) => received && moment.utc(received).format(),
    },

    created: {
      type: GraphQLString,
      description: "The time that this event was reported as performed.",
      resolve: ({ created }) => created && moment.utc(created).format(),
    },

    canonical_time: {
      type: GraphQLString,
      description: "The created time if specified; else the received time.",
      resolve: ({ canonical_time }) => canonical_time && moment.utc(canonical_time).format(),
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
      description: "The set of fields associated with this event.",
      type: new GraphQLList(new GraphQLObjectType({
        name: "Field",
        fields: () => ({
          key: {
            description: "The key for this field.",
            type: GraphQLString,
          },
          value: {
            description: "The value for this field.",
            type: GraphQLString,
          },
        }),
      })),
    },

    raw: {
      type: GraphQLString,
      description: "The raw event sent to the Retraced API.",
    },
  }),
});

const queryType = new GraphQLObjectType({
  description: "The root query object of the Retraced GraphQL interface.",
  name: "Query",
  fields: {
    search: {
      description: "Run an advanced search for events.",
      type: new GraphQLObjectType({
        description: "The results of a search query.",
        name: "EventsConnection",
        fields: {
          edges: {
            description: "The events and cursors matching the query.",
            type: new GraphQLList(new GraphQLObjectType({
              description: "The event and cursor for a single result.",
              name: "EventEdge",
              fields: {
                node: {
                  description: "The event object.",
                  type: eventType,
                },
                cursor: {
                  description: "An opaque cursor for paginating from this point in the search results. Use it as the <code>after</code> argument to paginate forward or the <code>before</code> argument to paginate backward.",
                  type: GraphQLString,
                },
              },
            })),
          },
          pageInfo: {
            description: "Indications that more search results are available.",
            type: new GraphQLObjectType({
              name: "PageInfo",
              fields: {
                hasNextPage: {
                  type: GraphQLBoolean,
                  description: "Indicates there are newer events matching the query when paging from oldest to newest with the <code>first</code> argument.",
                },
                hasPreviousPage: {
                  type: GraphQLBoolean,
                  description: "Indicates there are older events matching the query when paging from newest to oldest with the <code>last</code> argument.",
                },
              },
            }),
          },
          totalCount: {
            description: "The total number of search results matched by the query.",
            type: GraphQLInt,
          },
        },
      }),
      args: {
        query: {
          type: GraphQLString,
          description: "The <a href=/documentation/getting-started/searching-for-events/#structured-advanced-search>structured search operators</a> used to filter events.",
        },
        first: {
          type: GraphQLInt,
          description: "The limit of events to return, sorted from oldest to newest. It can optionally be used with the <code>after</code> argument.",
        },
        after: {
          type: GraphQLString,
          description: "A cursor returned from a previous query.",
        },
        last: {
          type: GraphQLInt,
          description: "The limit of events to return, sorted from newest to oldest. It can optionally be used with the <code>before</code> argument.",
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
