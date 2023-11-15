import * as _ from "lodash";
import axios from "axios";

export interface GraphQLSearchData {
  data: {
    search: {
      totalCount: number;
      pageInfo: {
        hasPreviousPage: boolean;
      };
      edges: {
        cursor: string;
        node: RawEventNode;
      }[];
    };
  };
}

export class EventsConnection {
  public totalCount: number;
  // 1-indexed
  public currentPageNumber: number;

  public currentResults: EventNode[];

  private cursors: string[];

  // Accepts a fully formed url and Authorization header so it can be used
  // with any Retraced API.
  constructor(
    private readonly url: string,
    private readonly authorization: string,
    private readonly query: StructuredQuery,
    private readonly mask: EventNodeMask,
    public readonly pageSize: number
  ) {
    this.cursors = [];
    this.totalCount = 0;
  }

  public totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  public hasPreviousPage(): boolean {
    return this.currentPageNumber > 1;
  }

  public hasNextPage(): boolean {
    return this.currentPageNumber < this.totalPages();
  }

  // Fetch the first page of results and metadata
  public async init() {
    this.cursors.push("");
    await this.call();
  }

  public async nextPage() {
    await this.call();
  }

  private async call() {
    const cursor = _.last(this.cursors);
    const body = {
      query: graphQLQuery(this.mask),
      variables: {
        query: stringifyStructuredQuery(this.query),
        last: this.pageSize,
        before: cursor,
      },
    };

    let searchData: GraphQLSearchData;
    try {
      const rsp = await axios.post<GraphQLSearchData>(this.url, body, {
        headers: {
          Accept: "application/json",
          Authorization: this.authorization,
        },
      });

      searchData = rsp.data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const statusText = err.response ? err.response.statusText : "Unknown";
      throw new Error(`Unexpected HTTP response: ${status} ${statusText}`);
    }

    const { data } = searchData;

    this.totalCount = data.search.totalCount;
    this.currentResults = data.search.edges.map((edge) => {
      return formatRawEventNode(edge.node);
    });
    this.currentPageNumber = this.cursors.length;
    if (data.search.pageInfo.hasPreviousPage) {
      this.cursors.push((_.last(data.search.edges) as any).cursor);
    }
  }
}

// https://boxyhq.com/docs/retraced/getting-started/searching-for-events#structured-advanced-search
export interface StructuredQuery {
  action?: string;
  crud?: string;
  received_start?: Date;
  received_end?: Date;
  created_start?: Date;
  created_end?: Date;
  actor_name?: string;
  actor_id?: string;
  description?: string;
  location?: string;
  external_id?: string;
}

export interface EventNodeMask {
  id?: boolean;
  action?: boolean;
  description?: boolean;
  group?: {
    id?: boolean;
    name?: boolean;
  };
  actor?: {
    id?: boolean;
    name?: boolean;
    href?: boolean;
    fields?: boolean;
  };
  target?: {
    id?: boolean;
    name?: boolean;
    href?: boolean;
    type?: boolean;
    fields?: boolean;
  };
  crud?: boolean;
  display?: {
    markdown?: boolean;
  };
  is_failure?: boolean;
  is_anonymous?: boolean;
  source_ip?: boolean;
  country?: boolean;
  loc_subdiv1?: boolean;
  loc_subdiv2?: boolean;
  received?: boolean;
  created?: boolean;
  canonical_time?: boolean;
  component?: boolean;
  version?: boolean;
  fields?: boolean;
  external_id?: boolean;
  metadata?: boolean;
}

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

export interface RawEventNode {
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
  external_id?: string;
  metadata?: FieldItem[];
}

export interface EventNode {
  id?: string;
  action?: string;
  description?: string;
  group?: {
    id?: string;
    name?: string;
  };
  actor?: {
    id?: string;
    name?: string;
    href?: string;
    fields?: { [key: string]: string };
  };
  target?: {
    id?: string;
    name?: string;
    href?: string;
    type?: string;
    fields?: { [key: string]: string };
  };
  crud?: "c" | "r" | "u" | "d";
  display?: {
    markdown?: string;
  };
  is_failure?: boolean;
  is_anonymous?: boolean;
  source_ip?: string;
  country?: string;
  received?: Date;
  created?: Date;
  fields?: { [key: string]: string };
  canonical_time?: Date;
  component?: string;
  version?: string;
  external_id?: string;
  metadata?: { [key: string]: string };
}

const fieldsMap = (fieldsList: FieldItem[]) => {
  const fields = {} as { [key: string]: string };

  return fieldsList.reduce((accm, field) => {
    accm[field.key] = field.value;
    return accm;
  }, fields);
};

// Converts fields properties to maps and time properties to Date objects.
export const formatRawEventNode = (node: RawEventNode): EventNode => {
  const conversions: EventNode = {};

  if (node.received) {
    conversions.received = new Date(node.received);
  }
  if (node.created) {
    conversions.created = new Date(node.created);
  }
  if (node.canonical_time) {
    conversions.canonical_time = new Date(node.canonical_time);
  }
  if (node.fields) {
    conversions.fields = fieldsMap(node.fields);
  }
  if (node.actor && node.actor.fields) {
    conversions.actor = _.extend(node.actor, {
      fields: fieldsMap(node.actor.fields),
    });
  }
  if (node.target && node.target.fields) {
    conversions.target = _.extend(node.target, {
      fields: fieldsMap(node.target.fields),
    });
  }

  return _.extend(node, conversions);
};

// Construct a graphQL query string from a mask specifying the desired fields.
// Includes variables $query, $last, and $before
export const graphQLQuery = (mask: EventNodeMask) => {
  let group = "";
  if (mask.group && (mask.group.id || mask.group.name)) {
    group = `group {
          ${mask.group.id ? "id" : ""}
          ${mask.group.name ? "name" : ""}
        }`;
  }

  let actor = "";
  if (mask.actor && (mask.actor.id || mask.actor.name || mask.actor.href || mask.actor.fields)) {
    actor = `actor {
          ${mask.actor.id ? "id" : ""}
          ${mask.actor.name ? "name" : ""}
          ${mask.actor.href ? "href" : ""}
          ${
            mask.actor.fields
              ? `fields {
            key
            value
          }`
              : ""
          }
        }`;
  }

  let target = "";
  if (
    mask.target &&
    (mask.target.id || mask.target.name || mask.target.href || mask.target.type || mask.target.fields)
  ) {
    target = `target {
          ${mask.target.id ? "id" : ""}
          ${mask.target.name ? "name" : ""}
          ${mask.target.href ? "href" : ""}
          ${mask.target.type ? "type" : ""}
          ${
            mask.target.fields
              ? `fields {
            key
            value
          }`
              : ""
          }
        }`;
  }

  let display = "";
  if (mask.display && mask.display.markdown) {
    display = `display {
          markdown
        }`;
  }

  const q = `query Search($query: String!, $last: Int, $before: String) {
  search(query: $query, last: $last, before: $before) {
    totalCount,
    pageInfo {
      hasPreviousPage
    }
    edges {
      cursor
      node {
        ${mask.id ? "id" : ""}
        ${mask.action ? "action" : ""}
        ${mask.description ? "description" : ""}
        ${group}
        ${actor}
        ${target}
        ${mask.crud ? "crud" : ""}
        ${display}
        ${mask.received ? "received" : ""}
        ${mask.created ? "created" : ""}
        ${mask.canonical_time ? "canonical_time" : ""}
        ${mask.is_failure ? "is_failure" : ""}
        ${mask.is_anonymous ? "is_anonymous" : ""}
        ${mask.source_ip ? "country" : ""}
        ${mask.loc_subdiv1 ? "loc_subdiv1" : ""}
        ${mask.loc_subdiv2 ? "loc_subdiv2" : ""}
        ${mask.component ? "component" : ""}
        ${mask.version ? "version" : ""}
        ${
          mask.fields
            ? `fields {
          key
          value
        }`
            : ""
        }
        ${mask.external_id ? "external_id" : ""}
        ${
          mask.metadata
            ? `metadata {
          key
          value
        }`
            : ""
        }
      }
    }
  }
}`;

  return q
    .split(/\n/)
    .filter((line) => line.trim())
    .join("\n");
};

// Convert a StructuredQuery object to string for the GraphQL search operation.
export const stringifyStructuredQuery = (queryObj: StructuredQuery): string => {
  const params: string[] = [];

  if (queryObj.action) {
    params.push(`action:"${queryObj.action}"`);
  }
  if (queryObj.crud) {
    params.push(`crud:${queryObj.crud}`);
  }
  if (queryObj.received_start || queryObj.received_end) {
    const start = queryObj.received_start ? queryObj.received_start.toISOString() : "";
    const end = queryObj.received_end ? queryObj.received_end.toISOString() : "";
    params.push(`received:${start},${end}`);
  }
  if (queryObj.created_start || queryObj.created_end) {
    const start = queryObj.created_start ? queryObj.created_start.toISOString() : "";
    const end = queryObj.created_end ? queryObj.created_end.toISOString() : "";
    params.push(`created:${start},${end}`);
  }
  if (queryObj.actor_name) {
    params.push(`actor.name:"${queryObj.actor_name}"`);
  }
  if (queryObj.actor_id) {
    params.push(`actor.id:${queryObj.actor_id}`);
  }
  if (queryObj.description) {
    params.push(`description:"${queryObj.description}"`);
  }
  if (queryObj.location) {
    params.push(`location:"${queryObj.location}"`);
  }

  return params.join(" ");
};
