import { RawEventNode } from "@retraced-hq/retraced";

export interface EventEdge {
  node?: RawEventNode;
  cursor?: string;
}

export interface PageInfo {
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface EventsConn {
  edges?: EventEdge[];
  pageInfo?: PageInfo;
  totalCount?: number;
}

export interface GraphQLSearchVars {
  /**
   * Structured search query. For example,
   *
   * `edit` -- free text search
   * `action:users.list` -- search by action
   * `action:document.* location:Germany` -- search by action and location
   * `actor.id:john.doe@mycompany.com` -- search by actor id
   *
   */
  query?: string;
  /** The number of events to return */
  last?: number;
  /** An opaque cursor that represents the offset to query since. Should be empty for an initial request to the API. Responses from GraphQL endpoints will include the cursor value to use to fetch the next page of data. */
  before?: string;
}

export interface GraphQLSearch {
  search: EventsConn;
}

export interface DocLocation {
  line: number;
  column: number;
}

export interface GraphQLError {
  message: string;
  locations?: DocLocation[];
  // path is actually (number|string)[];
  path?: string[];
}

export interface GraphQLResp {
  data?: GraphQLSearch;
  errors?: GraphQLError[];
}

export interface GraphQLRequest {
  /**
   * Graphql Search query string. See https://preview.retraced.io/documentation/apis/graphql/#search
   * for an example query
   */
  query: string;
  /** Search parameters for filtering, limit and offset */
  variables?: GraphQLSearchVars;
  /** The GraphQL operation name. Optional, defaults to standard event search. */
  operationName?: string;
}
