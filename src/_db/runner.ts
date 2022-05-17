#!/usr/bin/env node

import "source-map-support/register";
import yargs from "yargs";

const res = yargs.commandDir("../../build/_db/commands")
  .env()
  .help()
  .argv;
console.log(res);
