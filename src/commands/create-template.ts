import * as util from "util";
import createTemplate from "../models/template/create";
import {byName as deleteAllByName} from "../models/template/delete";
import {Template} from "../models/template/index";

exports.name = "create-template";
exports.describe = "Create a retraced logs-viewer display template in a project";
exports.builder = {
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

/*
[{"comparator": "eq", "path": "actor.id", "value": "null"}]
**{{ action }}:**  {{ description }}
 */

async function main(argv): Promise<Template> {
  const {projectId, environmentId, name, rule, template} = argv;

  const affected = await deleteAllByName({name, environmentId});

  console.log(`Removed ${affected} existing templates with name ${name} in env ${environmentId}`);

  return createTemplate({
    project_id: projectId,
    environment_id: environmentId,
    name,
    rule,
    template,
  });
}

exports.handler = async (argv) => {
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
