export interface FieldItem {
  key: string;
  value: string;
}

export interface EventNodeGroup {
  id?: string;
  name?: string;
}

export interface EventNodeActor {
  id?: string;
  name?: string;
  href?: string;
  fields?: FieldItem[];
}

export interface EventNodeTarget {
  id?: string;
  name?: string;
  href?: string;
  type?: string;
  fields?: FieldItem[];
}

export interface EventNodeDisplay {
  markdown?: string;
}

export interface EventNode {
  id?: string;
  action?: string;
  crud?: "c" | "r" | "u" | "d";
  description?: string;
  group?: EventNodeGroup;
  actor?: EventNodeActor;
  target?: EventNodeTarget;
  display?: EventNodeDisplay;
  is_failure?: boolean;
  is_anonymous?: boolean;
  source_ip?: string;
  country?: string;
  loc_subdiv1?: string;
  loc_subdiv2?: string;
  received?: string;
  created?: string;
  fields?: FieldItem[];
  canonical_time?: string;
  component?: string;
  version?: string;
  raw?: string;
}

export interface EventEdge {
  node?: EventNode;
  cursor?: string;
}

export interface PageInfo {
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface EventsConnection {
  edges?: EventEdge[];
  pageInfo?: PageInfo;
  totalCount?: number;
}

export interface GraphQLSearchVars {
  query?: string;
  last?: number;
  before?: string;
}

export interface GraphQLSearchData {
  search: EventsConnection;
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

export interface GraphQLResponse {
  data?: GraphQLSearchData;
  errors?: GraphQLError[];
}

export interface GraphQLRequest {
    query: string;
    variables?: GraphQLSearchVars;
    operationName?: string;
}
