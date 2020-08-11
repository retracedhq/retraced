import * as moment from "moment";
import * as stringify from "csv-stringify";
import * as _ from "lodash";
import * as sanitizefn from "sanitize-filename";

import getPgPool from "../../persistence/pg";
import { Scope } from "../../security/scope";
import { doAllQuery, Options } from "../event/query";
import filterEvents, { Options as FilterOptions } from "../event/filter";
import { parseQuery, ParsedQuery } from "../event";
import QueryDescriptor from "../query_desc/def";
import { logger } from "../../logger";

const pgPool = getPgPool();

const pageSize = process.env.EXPORT_PAGE_SIZE_INTERNAL ? parseInt(process.env.EXPORT_PAGE_SIZE_INTERNAL, 10) : 10000;

export default async function renderSavedExport(opts) {
  const { environmentId, projectId, groupId, savedExportId, format } = opts;

  const startTime = Date.now();

  const pg = await pgPool.connect();
  try {
    let q = `select name, body
      from saved_export
      where id = $1 and environment_id = $2 and project_id = $3`;
    const v = [savedExportId, environmentId, projectId];
    const result = await pg.query(q, v);
    if (!result.rows.length) {
      throw new Error(`No such saved export: id=${savedExportId}, envid=${environmentId}, projid=${projectId}`);
    }

    let queryDesc: QueryDescriptor = JSON.parse(result.rows[0].body);
    let queryName = result.rows[0].name;

    let results: any;

    if (process.env.PG_SEARCH) {
        const scope = {
            projectId,
            environmentId,
            groupId,
        };
        const filterOpts = filterOptions(scope, queryDesc);
        results = await filterEvents(filterOpts);
    } else {
      const scope: Scope = {
        projectId,
        environmentId,
        groupId,
      };
      const deepOpts: Options = {
        scope,
        query: "",
        size: pageSize,
        sort: "desc",
      };

      switch (queryDesc.version) {
        case 1:
          let cruds = _.compact([
            queryDesc.showCreate && "c",
            queryDesc.showRead && "r",
            queryDesc.showUpdate && "u",
            queryDesc.showDelete && "d"
          ]);
          deepOpts.query = `crud:${cruds.join(",")}`;

          if (queryDesc.startTime || queryDesc.endTime) {
            const start = moment(queryDesc.startTime || 0);
            const end = moment(queryDesc.endTime || Date.now());

            deepOpts.query += ` received:"${start.format()},${end.format()}"`
          }

          if (queryDesc.searchQuery) {
            deepOpts.query += " " + queryDesc.searchQuery;
          }
          break;

        default:
          throw new Error(`Unknown query descriptor version: ${queryDesc.version}`);
      }

      results = await doAllQuery(deepOpts);
      if (!results.totalHits) {
        return undefined;
      }
    }

    if (!results.totalHits) {
      return undefined;
    }

    // TODO(zhaytee): This might be a huge amount of data. Use the filesystem?
    let rendered;
    switch (format) {
      case "csv":
        rendered = await renderAsCSV(results.events);
        break;

      default:
        throw new Error(`Unknown rendering format: ${format}`);
    }

    const sanitized = sanitizefn(queryName).replace(/\s/g, "_");
    const filename = `${sanitized}.${format}`;

    logger.info(`exported ${results.totalHits.value} events in ${(Date.now().valueOf() - startTime.valueOf())/1000} seconds`);

    return {
      filename,
      rendered,
    };

  } finally {
    pg.release();
  }
}

async function renderAsCSV(events) {
  const processing = new Promise((resolve, reject) => {
    let accum = "";
    const stringifier = stringify({ header: true });
    stringifier.on("readable", () => {
      let row = stringifier.read();
      while (row) {
        accum += row;
        row = stringifier.read();
      }
    });
    stringifier.on("error", (err) => reject);
    stringifier.on("finish", () => resolve(accum));

    for (const ev of events) {
      // Flatten and clean up.
      const flatActor = {};
      if (ev.actor) {
        for (const key of _.keys(ev.actor)) {
          if (key === "retraced_object_type" ||
            key === "foreign_id" ||
            key === "environment_id" ||
            key === "project_id" ||
            key === "id") {
            continue;
          }
          flatActor[`actor_${key}`] = ev.actor[key];
        }
      }
      const flatObject = {};
      if (ev.object) {
        for (const key of _.keys(ev.object)) {
          if (key === "retraced_object_type" ||
            key === "foreign_id" ||
            key === "environment_id" ||
            key === "project_id" ||
            key === "id") {
            continue;
          }
          flatObject[`object_${key}`] = ev.object[key];
        }
      }
      const result = Object.assign({}, ev, flatActor, flatObject);
      delete result.actor;
      delete result.object;
      delete result.object_id;
      delete result.actor_id;
      delete result.raw;
      stringifier.write(result);
    }
    stringifier.end();
  });

  return await processing;
}

function filterOptions(scope: Scope, qd: QueryDescriptor): FilterOptions {
    const query: ParsedQuery = qd.searchQuery ? parseQuery(qd.searchQuery) : {};

    const crud: string[] = [];
    if (qd.showCreate) {
        crud.push("c");
    }
    if (qd.showRead) {
        crud.push("r");
    }
    if (qd.showUpdate) {
        crud.push("u");
    }
    if (qd.showDelete) {
        crud.push("d");
    }
    query.crud = crud;

    if (qd.startTime || qd.endTime) {
        query.received = [
            qd.startTime || moment("2017-01-01").valueOf(),
            qd.endTime || moment().add(1, "d").valueOf(),
        ];
    }

    return {
        query,
        scope,
        sort: "desc",
        size: 1000000,
    };
}
