#!/usr/bin/env node

import yargs from "yargs";
import * as email from "./commands/email";

export type yolo = any;

/* eslint-disable */
yargs
  .command(email.name, email.describe, <yolo>email.builder, email.handler)
  .env()
  .help().argv;
