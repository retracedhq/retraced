import * as _ from "lodash";
import * as elasticsearch from "elasticsearch";
import * as moment from "moment";
import * as uuid from "uuid";
import * as pg from "pg";
import { histogram, instrumented, meter } from "monkit";

import {
  AliasDesc,
  AliasRotator,
  default as getEs,
  putAliases,
} from "../persistence/elasticsearch";
import getPg from "../persistence/pg";
import { logger } from "../logger";

export type IndexNamer = (newDate: moment.Moment) => string;

export interface Environment {
    projectId: string;
    environmentId: string;
}

/**
 * For every retraced environment, create
 * a new index with a random-ish name,
 * and apply two aliases:
 *
 * - retraced.<project>.<env>.YYYYMMDD
 * - retraced.<project>.<env>
 *
 * Where YYYYMMDD is a date string representing tomorrow's date.
 *
 * The first alias will be written to by processor for events with received
 * starting tomorrow.
 *
 * The second alias will add the new index to the collection of indices
 * that are searched by the graphql search endpoints.
 */
export class ElasticsearchIndexRotator {

    public static default(): ElasticsearchIndexRotator {
        if (!ElasticsearchIndexRotator.instance) {
            ElasticsearchIndexRotator.instance = new ElasticsearchIndexRotator(
                getEs().indices,
                getEs().cat,
                getPg(),
                putAliases,
            );
        }

        return ElasticsearchIndexRotator.instance;
    }

    private static instance: ElasticsearchIndexRotator;

    private static defaultIndexNamer: IndexNamer = (newDate) => {
        const rand = uuid.v4().replace(/-/g, "");
        return `retraced.processor.rotate.${newDate.format("YYYYMMDD")}.${rand}`;
    }

    private readonly indexNamer: IndexNamer;

    constructor(
        private readonly indicesApi: elasticsearch.Indices,
        private readonly catApi: elasticsearch.Cat,
        private readonly pool: pg.Pool,
        private readonly aliasRotator: AliasRotator,
        indexNamer?: IndexNamer,
    ) {
        this.indicesApi = indicesApi;
        this.indexNamer = indexNamer || ElasticsearchIndexRotator.defaultIndexNamer;

    }

    public async worker(targetDate?: moment.Moment) {
        const nextDay = targetDate ? targetDate : this.tommorrow();
        const environments = await this.getEnvironments();
        return Promise.all(environments.map((e) => this.appendNewIndex(nextDay, e)));
    }

    public async repairAliases() {
        logger.info(`Running Elasticsearch Index Alias review`);
        const environments = await this.getEnvironments();
        const count = await Promise.all(environments.map((e) => this.verifyIndexAliases(e)))
            .then(_.sum);
        meter(`ElasticsearchIndexRotator.createWriteIndexIfNecessary.performRepair`).mark(count);
        logger.info(`Completed Elasticsearch Index Alias review with ${count} repairs performed.`);
    }

    @instrumented
    public async getEnvironments(): Promise<Environment[]> {
        const rows = await this.pool.query(`SELECT * FROM environment`);
        logger.info(`ElasticesearchIndexRotator Got ${rows.rowCount} rows from environment table`);
        return rows.rows.map((row) => {
            const { id, project_id } = row;
            const ret = { environmentId: id, projectId: project_id };
            return ret;
        });
    }

    public aliasRepr(alias: AliasDesc) {
        return `${alias.alias} => ${alias.index}`;
    }

    @instrumented
    public async verifyIndexAliases(env: Environment) {

        const searchAlias = `retraced.${env.projectId}.${env.environmentId}`;
        const writeAlias = `retraced.${env.projectId}.${env.environmentId}.current`;

        const existingSearchAliases = await this.catApi.aliases({ name: searchAlias, format: "json" });
        const existingWriteAliases = await this.catApi.aliases({ name: writeAlias, format: "json" });

        // This should never happen, every env should have at least an index with a search alias
        if (_.isEmpty(existingSearchAliases)) {
            await this.appendNewIndex(moment(), env);
            logger.info(env.environmentId, `CREATED No existing indices for search alias ${searchAlias}, created one`);
            return 1;
        }

        // Want exactly one write alias
        if (!_.isEmpty(existingWriteAliases) && existingWriteAliases.length === 1) {
            return 0;
        }

        // If more than one, remove all but one
        if (!_.isEmpty(existingWriteAliases) && existingWriteAliases.length > 1) {
            logger.info(`WARN found ${existingWriteAliases.length} write aliases`);
            histogram(`ElasticsearchIndexRotator.createWriteIndexIfNecessary.multipleWriteAliases`).update(existingWriteAliases.length);
            const toRemove = existingWriteAliases.slice(1);
            await this.aliasRotator([], toRemove);
            logger.info(`Removed the following aliases: ${toRemove.map((s) => this.aliasRepr(s))}`);
            return 1;
        }

        // Add the missing write alias
        if (_.isEmpty(existingWriteAliases)) {
            const aliasToAdd = {
                index: existingSearchAliases[0].index,
                alias: writeAlias,
            };

            await this.aliasRotator([aliasToAdd], []);
            logger.info(env.environmentId, `CREATED alias ${writeAlias} for index ${existingSearchAliases.map((i) => `${i.alias} => ${i.index}`)[0]}`);
            return 1;
        }
    }

    @instrumented
    public async appendNewIndex(newDate: moment.Moment, env: Environment) {

        const searchAlias = `retraced.${env.projectId}.${env.environmentId}`;
        const writeAlias = `retraced.${env.projectId}.${env.environmentId}.current`;
        const newIndexName = this.indexNamer(newDate);
        logger.info(env.environmentId, "NEW INDEX", newIndexName);

        const q: any = { name: writeAlias, format: "json" };

        const existingWriteAliases = await this.catApi.aliases(q);

        if (!_.isEmpty(existingWriteAliases)) {
            logger.info(env.environmentId, "found existing index alias for ", writeAlias, existingWriteAliases);
        }

        const aliases = {};
        aliases[searchAlias] = {};

        const params = {
            index: newIndexName,
            body: { aliases },
        };

        const resp = await this.indicesApi.create(params);

        logger.info(env.environmentId, `created index ${newIndexName} with aliases ${[searchAlias]}`);

        const toAdd = [{ index: newIndexName, alias: writeAlias }];
        const toRemove = existingWriteAliases || [];
        this.aliasRotator(toAdd, toRemove);

        logger.info(env.environmentId, `pre-existing indices ${existingWriteAliases.map((e) => e.index)} removed from alias ${writeAlias}`);
        logger.info(env.environmentId, `index ${newIndexName} added to ${writeAlias}`);
        return resp;
    }

    private tommorrow(): moment.Moment {
        const tomorrow = moment.utc();
        tomorrow.add(1, "day");
        return tomorrow;
    }

}

export const rotator = process.env.PG_SEARCH ? null : ElasticsearchIndexRotator.default();
export const worker = () => rotator ? rotator.worker(moment.utc().add(1, "days")) : () => {/* nope */};
export const repair = () => rotator ? rotator.repairAliases() : () => {/* nope */};
