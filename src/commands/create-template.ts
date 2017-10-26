import * as util from "util";
import createTemplate from "../models/template/create";
import {byName as deleteAllByName} from "../models/template/delete";

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

exports.handler = async (argv) => {
  const {projectId, environmentId, name, rule, template} = argv;
  deleteAllByName({name, environmentId})
    .then(() => {
      createTemplate({
        project_id: projectId,
        environment_id: environmentId,
        name,
        rule,
        template,
      })
      .then((t) => {
        console.log(`created template ${util.inspect(t)}`);
        process.exit(0);
      })
      .catch((err) => {
        console.log(util.inspect(err));
        process.exit(1);
      });
    });
};
