#!/usr/bin/env node

import "source-map-support/register";
import * as yargs from "yargs";
import * as email from "./commands/email";

export type yolo = any;

/* tslint:disable */
yargs
  .command(
    email.name,
    email.describe,
    <yolo> email.builder,
    email.handler,
  )
  .env()
  .help()
  .argv;
