import * as _ from "lodash";
import { Event, verifyHash } from "./event";
import { StructuredQuery, EventNodeMask, EventsConnection } from "./graphql";
import axios from "axios";

const defaultEndpoint = "http://localhost:3000/auditlog";

export interface Config {
  /** projectId is the retraced projectId */
  projectId: string;
  /** apiKey is an API token for the retraced publisher api */
  apiKey: string;
  /** endpoint is the retraced api base url, default is `http://localhost:3000/auditlog` */
  endpoint?: string;
  /** component is an identifier for a specific component of a vendor app platform */
  component?: string;
  /** version is an identifier for the specific version of this component, usually a git SHA */
  version?: string;
  /** viewLogAction is the action logged when a Viewer Token is used, default is `audit.log.view` */
  viewLogAction?: string;
}

export interface NewEventRecord {
  id: string;
  hash: string;
}

export class Client {
  private config: Config;

  constructor(config: Config) {
    if (!config.endpoint) {
      config.endpoint = defaultEndpoint;
    }
    this.config = config;
  }

  private mapping(event: Event): any {
    return {
      action: event.action,
      group: event.group,
      crud: event.crud,
      created: event.created,
      actor: event.actor,
      target: event.target,
      source_ip: event.source_ip,
      description: event.description,
      is_failure: event.is_failure,
      is_anonymous: event.is_anonymous,
      fields: event.fields,
      component: this.config.component,
      version: this.config.version,
      external_id: event.external_id,
      metadata: event.metadata,
    };
  }

  // confirms the hash and returns the ID of the event
  public async reportEvent(event: Event): Promise<string> {
    const { endpoint, apiKey, projectId } = this.config;

    const requestBody: any = this.mapping(event);

    let newEvent: NewEventRecord;
    try {
      const { data } = await axios.post<NewEventRecord>(
        `${endpoint}/publisher/v1/project/${projectId}/event`,
        requestBody,
        {
          headers: {
            Accept: "application/json",
            Authorization: `token=${apiKey}`,
          },
        }
      );

      newEvent = data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const statusText = err.response ? err.response.statusText : "Unknown";
      throw new Error(`Unexpected HTTP response: ${status} ${statusText}`);
    }

    try {
      verifyHash(event, newEvent);
    } catch (err) {
      throw new Error(`Local event hash calculation did not match the server's: ${err}`);
    }

    return newEvent.id;
  }

  // confirms the hash and returns the IDs of the new events
  public async reportEvents(events: Event[]): Promise<string[]> {
    const { endpoint, apiKey, projectId } = this.config;

    const requestBody: any = _.map(events, (event) => {
      return this.mapping(event);
    });

    let newEvents: NewEventRecord[];
    try {
      const { data } = await axios.post<NewEventRecord[]>(
        `${endpoint}/publisher/v1/project/${projectId}/event/bulk`,
        { events: requestBody },
        {
          headers: {
            Accept: "application/json",
            Authorization: `token=${apiKey}`,
          },
        }
      );

      newEvents = data;
    } catch (err) {
      const status = err.response ? err.response.status : 500;
      const statusText = err.response ? err.response.statusText : "Unknown";
      throw new Error(`Unexpected HTTP response: ${status} ${statusText}`);
    }

    try {
      _.forEach(newEvents, (newEvent, index) => {
        verifyHash(events[index], newEvent);
      });
    } catch (err) {
      throw new Error(`Local event hash calculation did not match the server's: ${err}`);
    }

    return newEvents.map((newEvent) => newEvent.id);
  }

  public async getViewerToken(groupId: string, actorId: string, isAdmin?: boolean): Promise<string> {
    const { endpoint, apiKey, projectId, viewLogAction } = this.config;

    const params = {
      group_id: groupId,
      actor_id: actorId,
      is_admin: "" + !!isAdmin,
    } as { [key: string]: string };

    if (viewLogAction) {
      params.view_log_action = viewLogAction;
    }

    const q = new URLSearchParams(params);

    const urlWithQuery = `${endpoint}/publisher/v1/project/${projectId}/viewertoken?${q.toString()}`;

    let token;
    try {
      const { data } = await axios.get<{ token: string }>(urlWithQuery, {
        headers: {
          Authorization: `Token token=${apiKey}`,
        },
      });

      token = data.token;
    } catch (err: any) {
      const status = err.response ? err.response.status : 500;
      const statusText = err.response ? err.response.statusText : "Unknown";
      throw new Error(`Unexpected HTTP response: ${status} ${statusText}`);
    }

    return token;
  }

  public async query(q: StructuredQuery, mask: EventNodeMask, pageSize: number): Promise<EventsConnection> {
    const { endpoint, apiKey, projectId } = this.config;

    const conn = new EventsConnection(
      `${endpoint}/publisher/v1/project/${projectId}/graphql`,
      `Token token=${apiKey}`,
      q,
      mask,
      pageSize
    );

    await conn.init();

    return conn;
  }
}
