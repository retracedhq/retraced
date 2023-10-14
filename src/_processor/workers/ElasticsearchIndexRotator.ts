import _ from "lodash";
import moment from "moment";
import pg from "pg";
import { AliasDesc, AliasRotator, putAliases, getESWithoutRetry } from "../../persistence/elasticsearch";
import getPg from "../persistence/pg";
import { logger } from "../logger";
import config from "../../config";
import { Client } from "@opensearch-project/opensearch";
import {
  incrementOtelCounter,
  instrumented,
  recordOtelHistogram,
} from "../../metrics/opentelemetry/instrumentation";

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
 * Where YYYYMMDD is a date string representing tomorrow"s date.
 *
 * The first alias will be written to by processor for events with received
 * starting tomorrow.
 *
 * The second alias will add the new index to the collection of indices
 * that are searched by the graphql search endpoints.
 */

export class ElasticsearchIndexRotator {
  public static default(): ElasticsearchIndexRotator {
    const es: Client = getESWithoutRetry();
    if (!ElasticsearchIndexRotator.instance) {
      ElasticsearchIndexRotator.instance = new ElasticsearchIndexRotator(
        es.indices,
        es.cat,
        getPg(),
        putAliases
      );
    }

    return ElasticsearchIndexRotator.instance;
  }

  private static instance: ElasticsearchIndexRotator;

  private static defaultIndexNamer: IndexNamer = (newDate) => {
    const rand = crypto.randomUUID().replace(/-/g, "");
    return `retraced.processor.rotate.${newDate.format("YYYYMMDD")}.${rand}`;
  };

  private readonly indexNamer: IndexNamer;

  constructor(
    private readonly indicesApi: any,
    private readonly catApi: any,
    private readonly pool: pg.Pool,
    private readonly aliasRotator: AliasRotator,
    indexNamer?: IndexNamer
  ) {
    this.indicesApi = indicesApi;
    this.catApi = catApi;
    this.pool = pool;
    this.aliasRotator = aliasRotator;
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
    const count = await Promise.all(environments.map((e) => this.verifyIndexAliases(e))).then(_.sum);
    logger.info(`Completed Elasticsearch Index Alias review with ${count} repairs performed.`);
    incrementOtelCounter("ElasticsearchIndexRotator.createWriteIndexIfNecessary.performRepair", count);
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
    if (_.isEmpty(existingSearchAliases.body)) {
      logger.info(
        env.environmentId,
        `CREATING No existing indices for search alias ${searchAlias}, creating one`
      );
      await this.appendNewIndex(moment(), env);
      logger.info(
        env.environmentId,
        `CREATED No existing indices for search alias ${searchAlias}, created one`
      );
      return 1;
    }

    // Want exactly one write alias
    if (!_.isEmpty(existingWriteAliases.body) && existingWriteAliases.body.length === 1) {
      return 0;
    }

    // If more than one, remove all but one
    if (!_.isEmpty(existingWriteAliases.body) && existingWriteAliases.body.length > 1) {
      logger.info(`WARN found ${existingWriteAliases.body.length} write aliases`);
      recordOtelHistogram(
        "ElasticsearchIndexRotator.createWriteIndexIfNecessary.multipleWriteAliases",
        existingWriteAliases.body.length
      );
      const toRemove = existingWriteAliases.body.slice(1);
      await this.aliasRotator([], toRemove);
      logger.info(`Removed the following aliases: ${toRemove.map((s) => this.aliasRepr(s))}`);
      return 1;
    }

    // Add the missing write alias
    if (_.isEmpty(existingWriteAliases.body)) {
      logger.info(
        env.environmentId,
        `CREATING alias ${writeAlias} for index ${
          existingSearchAliases.body.map((i) => `${i.alias} => ${i.index}`)[0]
        }`
      );
      const aliasToAdd = {
        index: existingSearchAliases.body[0].index,
        alias: writeAlias,
      };

      await this.aliasRotator([aliasToAdd], []);
      logger.info(
        env.environmentId,
        `CREATED alias ${writeAlias} for index ${
          existingSearchAliases.body.map((i) => `${i.alias} => ${i.index}`)[0]
        }`
      );
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

    if (!_.isEmpty(existingWriteAliases.body)) {
      logger.info(
        env.environmentId,
        "found existing index alias for ",
        writeAlias,
        existingWriteAliases.body
      );
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

    logger.info(
      env.environmentId,
      `pre-existing indices ${existingWriteAliases.map((e) => e.index)} removed from alias ${writeAlias}`
    );
    logger.info(env.environmentId, `index ${newIndexName} added to ${writeAlias}`);
    return resp.body;
  }

  private tommorrow(): moment.Moment {
    const tomorrow = moment.utc();
    tomorrow.add(1, "day");
    return tomorrow;
  }
}

export const rotator = config.PG_SEARCH ? null : ElasticsearchIndexRotator.default();
export const worker = () =>
  rotator
    ? rotator.worker(moment.utc().add(1, "days"))
    : () => {
        /* nope */
      };
export const repair = () =>
  rotator
    ? rotator.repairAliases()
    : () => {
        /* nope */
      };
