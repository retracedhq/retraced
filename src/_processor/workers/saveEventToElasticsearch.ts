import _ from "lodash";
import moment from "moment";
import { Clock } from "../common";
import { ClientWithRetry, getESWithRetry } from "../../persistence/elasticsearch";
import { instrumented, recordOtelHistogram } from "../../metrics/opentelemetry/instrumentation";

export class ElasticsearchSaver {
  public static getDefault(): ElasticsearchSaver {
    if (!ElasticsearchSaver.instance) {
      ElasticsearchSaver.instance = new ElasticsearchSaver(getESWithRetry(), moment.utc);
    }
    return ElasticsearchSaver.instance;
  }

  private static instance: ElasticsearchSaver;

  constructor(
    private readonly es: ClientWithRetry,
    private readonly clock: Clock
  ) {}

  public async saveEventToElasticsearch(job): Promise<void> {
    const jobObj = JSON.parse(job.body);
    const event = jobObj.event;

    this.cleanEvent(event);

    const alias = `retraced.${jobObj.projectId}.${jobObj.environmentId}.current`;
    try {
      await this.esIndex(event, alias);
    } catch (e) {
      e.retry = true;
      throw e;
    }

    this.trackTimeUntilSearchable(event.created, event.received);
  }

  private cleanEvent(event: any): any {
    if (event.group) {
      event.group = _.pick(event.group, ["id", "name"]);
    }
    if (event.actor) {
      event.actor = _.pick(event.actor, ["id", "foreign_id", "name", "url", "fields"]);

      if (event.actor.foreign_id) {
        event.actor.id = event.actor.foreign_id;
        _.unset(event.actor, "foreign_id");
      }
    }
    if (event.target) {
      event.target = _.pick(event.target, ["id", "foreign_id", "name", "url", "type", "fields"]);

      if (event.target.foreign_id) {
        event.target.id = event.target.foreign_id;
        _.unset(event.target, "foreign_id");
      }
    }
    return event;
  }

  @instrumented
  private async esIndex(event: any, alias: string) {
    const resp = await this.es.index({
      index: alias,
      type: "_doc",
      body: event,
      id: event.id ? event.canonical_time.toString() + "-" + event.id : undefined,
    });

    if (resp.body.errors === true) {
      throw new Error(this.buildErrorString(resp.body));
    }
    return resp;
  }

  private trackTimeUntilSearchable(created: number | undefined, received: number) {
    const now = this.clock().valueOf();
    if (created) {
      recordOtelHistogram("workers.saveEventToElasticSearch.latencyCreated", now - created);
    }
    recordOtelHistogram("workers.saveEventToElasticSearch.latencyReceived", now - received);
  }

  private buildErrorString(resp: any): string {
    let errString;
    _.forEach(resp.items, (itemObj) => {
      _.forEach(itemObj, (item, opName) => {
        const errorDesc = `'${opName}' failed: ${item.error.reason}, ${item.error.caused_by.reason}`;
        errString += `${errorDesc}; `;
      });
    });
    errString = _.trimEnd(errString, "; ");

    return errString;
  }
}

export default async function saveEventToElasticsearch(job): Promise<void> {
  return ElasticsearchSaver.getDefault().saveEventToElasticsearch(job);
}
