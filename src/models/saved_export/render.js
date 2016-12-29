import * as stringify from "csv-stringify";

import getPgPool from "../../persistence/pg";
import deepSearchEvents from "../event/deepSearch";
import getEventsBulk from "../event/getBulk";
import renderEvents from "../event/render";

const pgPool = getPgPool();

export default async function renderSavedExport(opts) {
  const { environmentId, projectId, teamId, savedExportId, format, source } = opts;

  const pg = await pgPool.connect();
  try {
    let q = `select body, version
      from saved_export
      where id = $1 and environment_id = $2 and project_id = $3`;
    const v = [savedExportId, environmentId, projectId];
    const result = await pg.query(q, v);
    if (!result.rows.length) {
      throw new Error(`No such saved export: id=${savedExportId}, envid=${environmentId}, projid=${projectId}`);
    }

    let queryDesc = result.rows[0].body;
    let queryVersion = result.rows[0].version;
    let query;
    switch (queryVersion) {
      case 1:
        query = {
          length: 0, // return all
          search_text: queryDesc.searchQuery,
          start_time: queryDesc.startTime,
          end_time: queryDesc.endTime,
          create: queryDesc.showCreate,
          read: queryDesc.showRead,
          update: queryDesc.showUpdate,
          delete: queryDesc.showDelete,
        };
        break;

      default:
        throw new Error(`Unknown query descriptor version: ${queryVersion}`);
    }

    const index = `retraced.${projectId}.${environmentId}`;
    const eventIds = await deepSearchEvents({
      index,
      team_id: teamId,
      query,
    });

    if (!eventIds.length) {
      return undefined;
    }

    const events = await getEventsBulk({
      project_id: projectId,
      environment_id: environmentId,
      event_ids: eventIds,
    });

    const fullEvents = await renderEvents({
      source: source,
      eventsIn: events,
      projectId: projectId,
      environmentId: environmentId,
    });

    let rendered;
    switch (format) {
      case "csv":
        rendered = await renderAsCSV(fullEvents);
        break;

      default:
        throw new Error(`Unknown rendering format: ${format}`);
    }

    // TODO(zhaytee): This might be a huge amount of data. Stream it from not-RAM?
    return rendered;

  } finally {
    pg.release();
  }
}

async function renderAsCSV(events) {
  const processing = new Promise((resolve, reject) => {
    let accum = "";
    const stringifier = stringify();
    stringifier.on("readable", () => {
      let row = stringifier.read();
      while (row) {
        result += row;
        row = stringifier.read();
      }
    });
    stringifier.on("error", err => reject);
    stringifier.on("finish", () => resolve(accum));
  });

  for (const ev of events) {
    /*
{ id: 'd074172ec3d148dabefadc965ac8d5cd',
  actor_id: 'd8a869d6c3fa49aabb9bbee1bfe583ec',
  object_id: null,
  description: 'Zagwe tafe kobosfa babadza ucpab hiwzap gemsezwi elici isumil ozeazifas ihce kievmul pipnefi beljamon gohhafpat wumjerboz.',
  action: 'web.owfi',
  crud: 'd',
  is_failure: null,
  is_anonymous: null,
  created: '2016-12-29T12:00:40.000Z',
  received: '2016-12-28T23:53:49.146Z',
  team_id: 'e3b96e9a-2284-5dcb-b757-069ae7e8810d',
  source_ip: '108.199.222.205',
  country: 'United States',
  loc_subdiv1: 'Wisconsin',
  loc_subdiv2: 'Milwaukee',
  raw: '{"action":"web.owfi","description":"Zagwe tafe kobosfa babadza ucpab hiwzap gemsezwi elici isumil ozeazifas ihce kievmul pipnefi beljamon gohhafpat wumjerboz.","source_ip":"108.199.222.205","actor":{"id":"5451c8bc-5d03-51d1-adbd-581830c34d26","name":"Mattie Franklin"},"team_id":"e3b96e9a-2284-5dcb-b757-069ae7e8810d","crud":"d","created":"Thu Dec 29 2016 04:00:40 GMT-0800 (PST)"}',
  actor: 
   { id: 'd8a869d6c3fa49aabb9bbee1bfe583ec',
     created: '2016-12-29T07:52:34.723Z',
     environment_id: 'b29c5c2c628d4a2985fb743555edb4cc',
     event_count: '84',
     first_active: '2016-12-29T07:52:34.723Z',
     foreign_id: '5451c8bc-5d03-51d1-adbd-581830c34d26',
     last_active: '2016-12-29T07:55:01.171Z',
     name: 'Mattie Franklin',
     project_id: '4629a09c13d2494b803697e749db417c',
     url: null,
     retraced_object_type: 'actor' },
  display_title: '**Mattie Franklin** performed the action **web.owfi**' }    
    */
    stringifier.write(ev);
  }
  stringifier.end();

  return await processing;
}
