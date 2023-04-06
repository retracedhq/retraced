#!/usr/bin/env node

import yargs from "yargs";
import * as bootstrap from "./commands/bootstrap";
import * as createTemplate from "./commands/create-template";
import * as listEnvironments from "./commands/list-environments";
import * as listProjects from "./commands/list-projects";

const res = yargs
  .env()
  .help()
  .command(bootstrap.name, bootstrap.describe, bootstrap.builder, bootstrap.handler)
  .command(createTemplate.name, createTemplate.describe, createTemplate.builder, createTemplate.handler)
  .command(
    listEnvironments.name,
    listEnvironments.describe,
    listEnvironments.builder,
    listEnvironments.handler
  )
  .command(listProjects.name, listProjects.describe, listProjects.builder, listProjects.handler).argv;
