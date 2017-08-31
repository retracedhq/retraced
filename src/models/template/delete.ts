import getPgPool from "../../persistence/pg";
import { logger } from "../../logger";

const pgPool = getPgPool();

export interface Options {
  templateId: string;
  environmentId: string;
}

/**
 * delete the template if it exists. Returns true if the template was deleted
 */
export default async function(opts: Options): Promise<boolean> {
  const q = `delete from display_template where id = $1 AND environment_id = $2`;
  const v = [
    opts.templateId,
    opts.environmentId,
  ];

  const result = await pgPool.query(q, v);
  logger.info(`deleted ${result.rowCount} templates`);

  return !!result.rowCount;
}
