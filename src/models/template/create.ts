import moment from "moment";

import { Template } from "./index";
import getPgPool from "../../persistence/pg";

const pgPool = getPgPool();

interface Opts {
  id?: string;
  project_id: string;
  environment_id: string;
  name: string;
  rule: string;
  template: string;
}

export default async function createTemplate(opts: Opts): Promise<Template> {
  const template = {
    id: opts.id || crypto.randomUUID().replace(/-/g, ""),
    created: moment(),
    updated: null,
    project_id: opts.project_id,
    environment_id: opts.environment_id,
    name: opts.name,
    rule: opts.rule,
    template: opts.template,
  };

  const q = `insert into display_template (
    id, created_at, updated_at, project_id, environment_id, name, rule, template
  ) values (
    $1, to_timestamp($2), to_timestamp($3), $4, $5, $6, $7, $8
  )`;
  const v = [
    template.id,
    template.created.unix(),
    template.updated,
    template.project_id,
    template.environment_id,
    template.name,
    template.rule,
    template.template,
  ];
  await pgPool.query(q, v);

  return template;
}
