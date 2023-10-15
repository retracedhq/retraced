import { getESWithRetry } from "../../persistence/elasticsearch";
import getPgPool from "../../persistence/pg";
import { Environment } from "./index";
import config from "../../config";
import uniqueId from "../uniqueId";

const pgPool = getPgPool();

const es = getESWithRetry();

interface Opts {
  name: string;
  projectId: string;

  id?: string;
}

export default async function createEnvironment(opts: Opts): Promise<Environment> {
  const environment = {
    id: opts.id || uniqueId(),
    name: opts.name,
    projectId: opts.projectId,
  };

  if (!config.PG_SEARCH) {
    // Create the ES index
    const searchAlias = `retraced.${environment.projectId}.${environment.id}`;
    const writeAlias = `retraced.${environment.projectId}.${environment.id}.current`;
    const newIndex = `retraced.api.${uniqueId()}`;
    const aliases = {};
    aliases[searchAlias] = {};
    aliases[writeAlias] = {};
    const params = {
      index: newIndex,
      body: {
        aliases,
      },
    };

    await es.indices.create(params);
  }

  const q = `insert into environment (
    id, name, project_id
  ) values (
    $1, $2, $3
  )`;
  const v = [environment.id, environment.name, environment.projectId];
  await pgPool.query(q, v);

  return environment;
}
