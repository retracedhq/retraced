import "source-map-support/register";
import getPgPool from "../../persistence/pg";
import { Scope } from "../../security/scope";

// same input and output interfaces as ./query
export interface Options {
  query: string;
  scope: Scope;
  sort: "asc" | "desc";
  size?: number;
  cursor?: [number, string];
}

export interface Result {
  totalHits: number;
  events: any[];
}

export default async function filter(opts: Options) Promise<Result> {
    const filters = parse(opts.query);

    filters.push({
        where: "project_id=$$",
        value: scope.projectId,
    });
    filters.push({
        where: "environment_id=$$",
        value: scope.environmentId,
    });

    if (scope.groupId) {
        filters.push({
            where: "group_id=$$",
            value: scope.groupId,
        });
    }

    if (scope.targetId) {
        filters.push({
            where: "target_id=$$",
            value: scope.targetId,
        });
    }

    // TODO offset and sort and limit

    const q = "SELECT doc FROM filters WHERE " + _.map(filters, (filter) => filter.where).join(" AND ");

    return pg.query(q, _.map(filters, (filter) => filter.value));
}

export interface Filter {
    where: string;
    value: string | Array;
}

export function parse(query: string): Filter[] {
    const filters = [];
    const options = {
        keywords: [
            "action",
            "crud",
            "received",
            "created",
            "actor.id",
            "actor.name",
            "description",
            "location",
        ],
    };
    const keywords = searchQueryParser.parse(query, options);

    if (keywords.action && keywords.action !== "*") {
        if (isPrefix(keywods.action)) {
            filters.push({
                where: "action LIKE $$",
                // TODO final only
                value: keywords.action.replace("*", "%"),,
            });
        }
    }

    if (keywords.crud) {
        if (Array.isArray(keywords.crud)) {
            // crud:c,d will have been split to ["c", "d"]
            filters.push({
                where: "crud in ($$)",
                value: keywords.crud,
            });
        } else {
            filters.push({
                where: "crud = $$",
                value: keywords.crud,
            });
        }
    }

    if (keywords.received) {
        const range = scrubDatetimeRange(keywords.received);

        filters.push({
            where: "received > $ && received < $$",
            value: range,
        });
    }

    if (keywords.created) {
        const range = scrubDatetimeRange(keywords.created);

        filters.push({
            where: "created > $ AND received < $",
            value: range,
        });
    }

    if (keywords["actor.id"]) {
       filters.push({
           where: "actor_id = $$",
           value: keywords["actor.id"],
       });
    }

    if (keywords["actor.name"]) {
        filters.push({
            where: "actor_name = $$",
            value: keywords["actor_name"],
        });
    }

    if (keywords.description) {
        filters.push({
            where: "to_tsvector(description) && to_tsquery($$)",
            // TODO should the search temrs be or'd?
            value: keywords.description.join(" & "),
        });
    }

    if (keywords.location) {
        filters.push({
            where: "to_tsvector(country || ' ' || loc_subdiv1 || ' ' || loc_subdiv2) @@ to_tsquery(&&)",
            value: keywords.location.join(" & "),
        });
    }

    // free text
    if ((_.isString(keywords) && keywords) || keywords.text) {
        filters.push({
            where: "to_tsvector(terms) && to_tsquery($$)",
            value: _.isString(keywords) ? keywords : keywords.text,
        });
    }
}
