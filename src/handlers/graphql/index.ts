import {
  RawEventNode,
} from "retraced";

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
  query?: string;
  last?: number;
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
    query: string;
    variables?: GraphQLSearchVars;
    operationName?: string;
}
