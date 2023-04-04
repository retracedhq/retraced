#!/usr/bin/env node

import yargs from "yargs";

yargs.commandDir("../../build/_db/commands").env().help().argv;
