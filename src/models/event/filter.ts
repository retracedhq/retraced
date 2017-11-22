import "source-map-support/register";
import * as _ from "lodash";

import getPgPool from "../../persistence/pg";
import { Scope } from "../../security/scope";
import { parseQuery, ParsedQuery, ActionQuery } from "./";

export interface Options {
  query: string | ParsedQuery;
  scope: Scope;
  sort: "asc" | "desc";
  size?: number;
  cursor?: [number, string];
}

export interface Result {
  totalHits: number;
  events: any[];
}

export interface Filter {
    where: string;
    values: Array<string | number>;
}

const pgPool = getPgPool();
const defaultSize = 20;

export default async function filter(opts: Options): Promise<Result> {
    const query = _.isString(opts.query) ? parseQuery(opts.query) : opts.query;
    const filters = getFilters(query, opts.scope);
    const size = opts.size || defaultSize;
    const wheres = filters.map(({ where }) => where);
    const vals = _.flatten(filters.map(({ values }) => values));
    // copies without cursor filters for total count
    const wheresForCountQ = wheres.slice();
    const valsForCountQ = vals.slice();
    const nextParam = paramer(vals.length);

    // Like ES, the cursor is a timestamp and id. The id is only used for events
    // exactly matching the timestamp.
    if (opts.cursor) {
        if (opts.sort === "desc") {
            wheres.push(
                `(((doc -> 'canonical_time')::text::bigint < ${nextParam()}) OR ((doc -> 'canonical_time')::text::bigint = ${nextParam()} AND id < ${nextParam()}))`,
            );
            vals.push(opts.cursor[0], opts.cursor[0], opts.cursor[1]);
        } else {
            wheres.push(`(((doc -> 'canonical_time')::text::bigint > ${nextParam()}) OR ((doc -> 'canonical_time')::text::bigint = ${nextParam()} AND id > ${nextParam()}))`);
            vals.push(opts.cursor[0]);
        }
    }

    const q = `
        SELECT doc
        FROM indexed_events
        WHERE ${wheres.join(" AND ")}
        ORDER BY (doc-> 'canonical_time')::text::bigint ${_.toUpper(opts.sort)}, id ${_.toUpper(opts.sort)}
        LIMIT ${size}`;

    const results = await pgPool.query(q, vals);
    const events = results.rows ? results.rows.map((row) => row.doc) : [];

    const countQ = `
        SELECT COUNT(1)
        FROM indexed_events
        WHERE ${wheresForCountQ.join(" AND ")}`;
    const count = await pgPool.query(countQ, valsForCountQ);
    const totalHits = parseInt(count.rows[0].count, 10);

    return {
        events,
        totalHits,
    };
}

const paramer = (after: number): (() => string) => {
    return (): string => `$${++after}`;
};

const orJoin = (filters: Filter[]): Filter =>  {
    if (filters.length === 1) {
        return filters[0];
    }
    return {
        where: `(${filters.map((f) => f.where).join(" OR ")})`,
        values: _.flatten(filters.map((f) => f.values)),
    };
};

// quote makes string primitives valid JSON
const quote = (s: string): string => `"${s}"`;

export function getFilters(query: ParsedQuery, scope: Scope): Filter[] {
    const filters: Filter[] = [];
    const nextParam = paramer(0);

    if (query.actions) {
        const some = query.actions.map((actionQuery: ActionQuery) => {
            if (actionQuery.isPrefix) {
                return {
                    where: `(doc -> 'action')::text LIKE ${nextParam()}`,
                    values: [quote(`${actionQuery.term}%`)],
                };
            }
            return {
                where: `(doc -> 'action')::text = ${nextParam()}`,
                values: [quote(actionQuery.term)],
            };
        });

        filters.push(orJoin(some));
    }

    if (query.crud && query.crud.length) {
        const some = query.crud.map((letter) => {
            return {
                where: `(doc -> 'crud') @> ${nextParam()}`,
                values: [quote(letter)],
            };
        });

        filters.push(orJoin(some));
    }

    if (query.received) {
        filters.push({
            where: `(doc -> 'received')::text::bigint >= ${nextParam()} AND (doc -> 'received')::text::bigint < ${nextParam()}`,
            values: query.received,
        });
    }

    if (query.created) {
        filters.push({
            where: `(doc -> 'created')::text::bigint >= ${nextParam()} AND (doc -> 'created')::text::bigint < ${nextParam()}`,
            values: query.created,
        });
    }

    if (query.actor_id) {
        const some = _.map(query.actor_id, (id) => {
            return {
                where: `(doc -> 'actor' -> 'id') @> ${nextParam()}`,
                values: [quote(id)],
            };
        });

        filters.push(orJoin(some));
    }

    if (query.actor_name) {
        const some = _.map(query.actor_name, (name) => {
            return {
                where: `to_tsvector('english', (doc -> 'actor' -> 'name')) @@ plainto_tsquery('english', ${nextParam()})`,
                values: [name],
            };
        });

        filters.push(orJoin(some));
    }

    if (query.description) {
        filters.push({
            where: `to_tsvector('english', (doc -> 'description')) @@ plainto_tsquery('english', ${nextParam()})`,
            values: [query.description.join(" & ")],
        });
    }

    // TODO
    if (query.location) {
        // structured search for "location" not implemented - add to free text
        const loc = query.location.join(" ");

        query.text = query.text ? query.text + loc : loc;
    }

    if (query.text) {
        filters.push({
            // this only searches values in "fields", not keys
            where: `to_tsvector('english', doc) @@ plainto_tsquery('english', ${nextParam()})`,
            // all terms must appear in the document
            values: [query.text],
        });
    }

    // scope filters
    filters.push({
        where: `project_id = ${nextParam()}`,
        values: [scope.projectId],
    });
    filters.push({
        where: `environment_id = ${nextParam()}`,
        values: [scope.environmentId],
    });
    if (scope.groupId) {
        filters.push({
            where: `(doc -> 'group' -> 'id') @> ${nextParam()}`,
            values: [quote(scope.groupId)],
        });
    }
    if (scope.targetId) {
        filters.push({
            where: `(doc -> 'target' -> 'id') @> ${nextParam()}`,
            values: [quote(scope.targetId)],
        });
    }

    return filters;
}
