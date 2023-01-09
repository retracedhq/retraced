#!/usr/bin/env node

import yargs from "yargs";

const res = yargs.commandDir("../../build/_db/commands").env().help().argv;
console.log(res);
