#!/usr/bin/env node

import "source-map-support/register";
import * as yargs from "yargs";

yargs
  .commandDir("../build/commands")
  .env()
  .help()
  .argv;
