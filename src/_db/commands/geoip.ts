import picocolors from "picocolors";
import readline from "readline";
import fs from "fs";
import util from "util";
import ProgressBar from "progress";
import clispinner from "cli-spinner";

import getPgPool from "../persistence/pg";

const pgPool = getPgPool();
const Spinner = clispinner.Spinner;

export const command = "geoip";

export const describe = "uploads a geoip database";

export const builder = {
  q: {
    alias: "query",
  },
  postgresHost: {
    demand: true,
  },
  postgresPort: {
    demand: true,
  },
  postgresDatabase: {
    demand: true,
  },
  postgresUser: {
    demand: true,
  },
  postgresPassword: {
    demand: true,
  },
  blockfile: {},
  locationfile: {},
};

export const handler = (argv) => {
  if (argv.query) {
    doQuery(argv);
    return;
  }

  if (argv.blockfile || argv.locationfile) {
    if (argv.blockfile && argv.locationfile) {
      doUpload(argv);
    } else {
      console.log(picocolors.red('Both "locationfile" and "blockfile" parameters are required to upload'));
    }
    return;
  }

  console.log(
    picocolors.red(
      "Specify either -q (for a geoip query) or --blockfile and --locationfile (for geoip upload)"
    )
  );
};

function doQuery(argv) {
  const sp = new Spinner("Running query...");
  sp.setSpinnerString(6);
  sp.start();

  const startTime = new Date().getTime();

  pgPool
    .query(`select * from geoip where network >> '${argv.query}'`)
    .then((results) => {
      sp.stop();
      console.log();
      console.log(util.inspect(results.rows[0]));
      console.log(`Operation took ${new Date().getTime() - startTime}ms`);
      process.exit(0);
    })
    .catch((err) => {
      console.log(picocolors.red(err));
      process.exit(1);
    });
}

function doUpload(argv) {
  parseLocationData(argv.locationfile)
    .then((locations) => translateIPBlockData(argv.blockfile, locations))
    .then(() => {
      console.log(picocolors.green("Done!"));
      process.exit(0);
    })
    .catch((err) => {
      console.log(picocolors.red(err), picocolors.red(err.stack));
      process.exit(1);
    });
}

function parseLocationData(filename) {
  return new Promise((resolve, reject) => {
    const result = {};

    const locReader = readline.createInterface({
      input: fs.createReadStream(filename),
    });
    let first = true;
    locReader.on("line", (line) => {
      // Skip CSV column names.
      if (first) {
        first = false;
        return;
      }
      const tokens = line.replace(/"/g, "").replace(/'/g, `''`).split(",");
      result[tokens[0]] = {
        geonameId: tokens[0],
        country: tokens[5],
        subdiv1: tokens[7],
        subdiv2: tokens[10],
        timeZone: tokens[12],
      };
    });

    locReader.on("close", () => {
      resolve(result);
    });

    locReader.on("error", (err) => reject(err));
  });
}

function translateIPBlockData(filename, locations) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filename);
    console.log();
    const pbar = new ProgressBar("  processing [:bar] :percent", {
      incomplete: " ",
      width: 40,
      total: fs.statSync((readStream as any).path).size,
    });
    readStream.on("data", (chunk) => {
      pbar.tick(chunk.length);
    });

    const blockReader = readline.createInterface({
      input: readStream,
    });

    const insertBatchSize = 10000;

    let queuedValues: any[] = [];
    let first = true;
    blockReader.on("line", (line) => {
      // Skip CSV column names.
      if (first) {
        first = false;
        return;
      }

      const tokens = line.split(",");
      const cidr = tokens[0];
      const loc = locations[tokens[1]];
      let locCountry = "unknown";
      let locSubdiv1 = "unknown";
      let locSubdiv2 = "unknown";
      let locTimeZone = "unknown";
      if (loc) {
        if (loc.country) {
          locCountry = loc.country;
        }
        if (loc.subdiv1) {
          locSubdiv1 = loc.subdiv1;
        }
        if (loc.subdiv2) {
          locSubdiv2 = loc.subdiv2;
        }
        if (loc.timeZone) {
          locTimeZone = loc.timeZone;
        }
      }

      const values = `('${cidr}', ${tokens[7]}, ${tokens[8]}, '${locCountry}', '${locSubdiv1}', '${locSubdiv2}', '${locTimeZone}')`;
      queuedValues.push(values);
      if (queuedValues.length === insertBatchSize) {
        blockReader.pause();
        const ultraString = `insert into geoip (network, lat, lon, country, subdiv1, subdiv2, timezone) values ${queuedValues.join(
          ","
        )};`;
        pgPool
          .query(ultraString)
          .then(() => {
            queuedValues = [];
            blockReader.resume();
          })
          .catch((err) => {
            blockReader.close();
            reject(err);
          });
      }
    });

    blockReader.on("close", () => {
      // Final insert.
      const ultraString = `insert into geoip (network, lat, lon, country, subdiv1, subdiv2, timezone) values ${queuedValues.join(
        ","
      )};`;
      pgPool
        .query(ultraString)
        .then(() => {
          resolve({});
        })
        .catch((err) => {
          reject(err);
        });
    });

    blockReader.on("error", (err) => reject(err));
  });
}

exports.command = command;
exports.describe = describe;
exports.builder = builder;
exports.handler = handler;
