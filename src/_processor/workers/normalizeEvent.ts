import _ from "lodash";
import moment from "moment";
import upsertActor from "../models/actor/upsert";
import upsertGroup from "../models/group/upsert";
import upsertAction from "../models/action/upsert";
import upsertTarget from "../models/target/upsert";
import getPgPool from "../persistence/pg";
import getLocationByIP from "../persistence/geoip";
import nsq from "../persistence/nsq";
import { logger } from "../logger";
import { mapValues } from "../../common/mapper";

const pgPool = getPgPool();

export default async function normalizeEvent(job) {
  const jobObj = JSON.parse(job.body);
  const taskId = jobObj.taskId;

  const pg = await pgPool.connect();
  try {
    const fields = `id, original_event, normalized_event, saved_to_dynamo, saved_to_postgres,
      saved_to_elasticsearch, project_id, environment_id, new_event_id,
      extract(epoch from received) * 1000 as received`;
    const pgResp = await pg.query(`select ${fields} from ingest_task where id = $1`, [taskId]);
    if (!pgResp.rows.length) {
      throw new Error(`Couldn't find ingestion task with id '${taskId}'`);
    }

    const task = pgResp.rows[0];
    const origEvent = JSON.parse(task.original_event);
    let newEventId = task.new_event_id;

    // id is mandatory!
    if (_.isEmpty(newEventId) || _.isNil(newEventId)) {
      throw new Error("No canonical event id was given to the event normalization function");
    }

    let processingNewEvent = true;
    if (task.normalized_event) {
      logger.info(
        `Ingestion task with id '${taskId}' has already been normalized (processing it again, though!)`
      );
      processingNewEvent = false;
      // Since this is a re-processing of a task which has already had its event normalized,
      // we grab the event id out of the existing normalized event (if any).
      // This may be necessary because legacy tasks did not contain new_event_id fields.
      // Instead, the new event id was generated here in the processor and written to the
      // normalized_event field of the task record (in Postgres).
      const neObj = JSON.parse(task.normalized_event);
      if (!newEventId && neObj.id) {
        newEventId = neObj.id;
      }
    }

    let groupToUpsert = origEvent.group;
    if (!groupToUpsert) {
      if (origEvent.team_id) {
        groupToUpsert = {
          id: origEvent.team_id,
          name: origEvent.team_id,
        };
      }
    }

    let group;
    if (groupToUpsert) {
      group = await upsertGroup(
        {
          group: groupToUpsert,
          projectId: task.project_id,
          environmentId: task.environment_id,
          updateOnConflict: processingNewEvent,
        },
        pg
      );
    }

    let actor;
    if (origEvent.actor) {
      actor = await upsertActor(
        {
          actor: origEvent.actor,
          projectId: task.project_id,
          environmentId: task.environment_id,
          updateOnConflict: processingNewEvent,
        },
        pg
      );
    }

    let target;
    if (origEvent.target) {
      target = await upsertTarget(
        {
          target: origEvent.target,
          projectId: task.project_id,
          environmentId: task.environment_id,
          updateOnConflict: processingNewEvent === true,
        },
        pg
      );
    }

    await upsertAction(
      {
        action: origEvent.action,
        projectId: task.project_id,
        environmentId: task.environment_id,
        updateOnConflict: processingNewEvent === true,
      },
      pg
    );

    let locInfo;
    if (origEvent.source_ip) {
      locInfo = await getLocationByIP(origEvent.source_ip);
    }

    // TODO(zhaytee): Add typing
    const normalizedEvent: any = processEvent(
      origEvent,
      parseInt(task.received, 10),
      Object.assign({}, group),
      Object.assign({}, actor),
      Object.assign({}, target),
      locInfo,
      newEventId
    );

    const updateStmt = `update ingest_task
      set normalized_event = $1
      where id = $2`;
    await pg.query(updateStmt, [JSON.stringify(normalizedEvent), task.id]);
    // condense original_event
    const compressedEvent = compressOriginalEvent(origEvent, normalizedEvent);
    const updateCompressed = `update ingest_task
    set original_event = '', compressed_event = $1
    where id = $2`;
    await pg.query(updateCompressed, [compressedEvent, taskId]);

    // We only do these things if this is a fresh run.
    if (processingNewEvent) {
      const message = {
        projectId: task.project_id,
        environmentId: task.environment_id,
        event: normalizedEvent,
      };
      await nsq.produce("normalized_events", JSON.stringify(message));
    }
  } finally {
    pg.release();
  }
}

function processEvent(origEvent, received, group, actor, target, locInfo, newEventId: string) {
  const result: any = _.pick(origEvent, [
    "action",
    "component",
    "created",
    "crud",
    "description",
    "is_anonymous",
    "is_failure",
    "source_ip",
    "version",
  ]);

  result.id = newEventId;
  result.received = received;

  if (_.isEmpty(result.source_ip)) {
    _.unset(result, "source_ip");
  }

  if (result.created) {
    result.created = moment(result.created).valueOf();
    // Anything after year 3000 is interpreted as micro or nanoseconds
    while (result.created > 32503680000000) {
      result.created = Math.floor(result.created / 1000);
    }
  }

  // Favor "created" timestamp over "received".
  if (result.created) {
    result.canonical_time = result.created;
  } else {
    result.canonical_time = result.received;
  }

  if (!_.isEmpty(origEvent.fields)) {
    result.fields = origEvent.fields;
  }

  // The group id comes from postgres as "group_id", so we transform it to "id" here.
  if (group) {
    group.id = group.group_id;
    _.unset(group, "group_id");
    result.group = mapValues(group);
  }

  if (actor) {
    result.actor = mapValues(actor);
  }

  if (target) {
    result.target = mapValues(target);
  }

  if (locInfo) {
    // if (locInfo.lat) {
    //   result.lat = locInfo.lat;
    // }
    // if (locInfo.lon) {
    //   result.lon = locInfo.lon;
    // }
    if (locInfo.country) {
      result.country = locInfo.country;
    }
    if (locInfo.subdiv1) {
      result.loc_subdiv1 = locInfo.subdiv1;
    }
    if (locInfo.subdiv2) {
      result.loc_subdiv2 = locInfo.subdiv2;
    }
    // if (locInfo.timezone) {
    //   result.time_zone = locInfo.timezone;
    // }
  }

  if (origEvent.external_id) {
    result.external_id = origEvent.external_id;
  }

  if (!_.isEmpty(origEvent.metadata)) {
    result.metadata = origEvent.metadata;
  }

  return result;
}

function compressOriginalEvent(originalEvent, normalizedEvent) {
  let compressedEvent = _.pick(originalEvent, [
    "action",
    "actor",
    "component",
    "created",
    "crud",
    "description",
    "external_id",
    "fields",
    "group",
    "is_anonymous",
    "is_failure",
    "metadata",
    "source_ip",
    "target",
    "version",
  ]);

  compressedEvent = _.mapValues(compressedEvent, (value, key) => {
    if (key === "actor") {
      return _.mapValues(compressedEvent.actor, (_value, _key) => {
        if ((_key === "name" || _key === "fields") && _.isEqual(normalizedEvent.actor[_key], _value)) {
          return "";
        }
        if (_key === "id" && _.isEqual(normalizedEvent.actor.foreign_id, _value)) {
          return "";
        }
        if (_key === "href" && _.isEqual(normalizedEvent.actor.url, _value)) {
          return "";
        }
        // Should not reach here as schema is validated much before in the flow
        return _value;
      });
    } else if (key === "target") {
      return _.mapValues(compressedEvent.target, (_value, _key) => {
        if (["name", "type", "fields"].includes(_key) && _.isEqual(normalizedEvent.target[_key], _value)) {
          return "";
        }
        if (_key === "id" && _.isEqual(normalizedEvent.target.foreign_id, _value)) {
          return "";
        }
        if (_key === "href" && _.isEqual(normalizedEvent.target.url, _value)) {
          return "";
        }
        // Should not reach here as schema is validated much before in the flow
        return _value;
      });
    } else if (key === "group") {
      return _.mapValues(compressedEvent.group, (_value, _key) => {
        if (["name", "id"].includes(_key) && _.isEqual(normalizedEvent.group[_key], _value)) {
          return "";
        }
        // Should not reach here as schema is validated much before in the flow
        return _value;
      });
    } else if (key === "created") {
      // created is transformed into unix timestamp inside normalized_event, hence retaining original value here
      return value;
    } else if (_.isEqual(normalizedEvent[key], value)) {
      return "";
    } else {
      // Should not reach here as schema is validated much before in the flow
      return value;
    }
  });

  return compressedEvent;
}
