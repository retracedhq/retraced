import * as util from "util";
import createTemplate from "../models/template/create";
import {byName as deleteAllByName} from "../models/template/delete";
import {Template} from "../models/template/index";

export const name = "create-template";
export const describe = "";
export const builder = {
  projectId: {
    demand: true,
  },
  environmentId: {
    demand: true,
  },
  name: {
    demand: true,
  },
  rule: {
    demand: true,
  },
  template: {
    demand: true,
  },
};

export async function main(argv): Promise<Template> {
  const {projectId, environmentId, rule, template} = argv;
  const templateName = argv.name;

  const affected = await deleteAllByName({name: templateName, environmentId});

  console.log(`Removed ${affected} existing templates with name ${templateName} in env ${environmentId}`);

  return createTemplate({
    project_id: projectId,
    environment_id: environmentId,
    name: templateName,
    rule,
    template,
  });
}

export const handler = async (argv) => {
  main(argv)
    .then((t) => {
      console.log(`created template ${util.inspect(t)}`);
      process.exit(0);
    })
    .catch((err) => {
      console.log(util.inspect(err));
      process.exit(1);
    });
};
