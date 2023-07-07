import fs from "fs";
import path from "path";
import readline from "readline";
import axios from "axios";
import unzipper from "unzipper";
import _ from "lodash";
import moment from "moment";
import * as csv from "csv-string";

import getPgPool from "../persistence/pg";
import { logger } from "../logger";
import config from "../../config";

const pgPool = getPgPool();

// The zip archive has a folder named e.g. GeoLite2-City-CSV_20230106/
const source = `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City-CSV&license_key=${config.GEOIPUPDATE_LICENSE_KEY}&suffix=zip`;
const zipFileName = "GeoLite2-City-CSV.zip";
const locFileName = "GeoLite2-City-Locations-en.csv";
const ipv4FileName = "GeoLite2-City-Blocks-IPv4.csv";
const ipv6FileName = "GeoLite2-City-Blocks-IPv6.csv";
const zipFilePath = path.join(config.TMPDIR || "/tmp", zipFileName);
const locFilePath = path.join(config.TMPDIR || "/tmp", locFileName);
const ipv4FilePath = path.join(config.TMPDIR || "/tmp", ipv4FileName);
const ipv6FilePath = path.join(config.TMPDIR || "/tmp", ipv6FileName);

export default async function updateGeoData() {
  if (
    config.RETRACED_DISABLE_GEOSYNC ||
    (!config.GEOIPUPDATE_LICENSE_KEY && !config.MAXMIND_GEOLITE2_USE_MMDB)
  ) {
    logger.info("UpdateGeoData: GeoIP sync disabled");
    return;
  }

  // Postgres records update
  // Use cached files if less than a day old.
  const downloadsNeeded = await Promise.all([
    downloadNeeded(locFilePath),
    downloadNeeded(ipv4FilePath),
    downloadNeeded(ipv6FilePath),
  ]);
  if (_.some(downloadsNeeded)) {
    logger.info("UpdateGeoData: Downloading new GeoIP data files");
    await download();
  } else {
    logger.info("UpdateGeoData: Using cached GeoIP data files");
  }

  const locStream = fs.createReadStream(locFilePath);
  const ipv4Stream = fs.createReadStream(ipv4FilePath);
  const ipv6Stream = fs.createReadStream(ipv6FilePath);

  const locations = await parseLocationData(locStream);
  const date = moment.utc();

  await translateIPBlockData(ipv4Stream, locations, date);
  await translateIPBlockData(ipv6Stream, locations, date);
  await clean(date);
}

// Check if a file is missing or more than a day old.
async function downloadNeeded(pathname: string) {
  return new Promise((resolve) => {
    fs.stat(pathname, (err, stats) => {
      if (err && err.code !== "ENOENT") {
        logger.error(`UpdateGeoData: ${err.message}`);
      }
      if (err || !stats) {
        resolve(true);
        return;
      }
      if (moment(stats.birthtime) < moment().subtract(1, "day")) {
        resolve(true);
        return;
      }
      resolve(false);
      return;
    });
  });
}

async function download() {
  const response = await axios({
    method: "GET",
    url: source,
    responseType: "stream",
  });

  await write(zipFilePath, response.data);

  // unzipper uses http range headers to read the remote file contents and
  // download only the requested files
  const archive = await unzipper.Open.file(zipFilePath);

  for (const file of archive.files) {
    if (_.endsWith(file.path, locFileName)) {
      await write(locFilePath, file.stream());
    }
    if (_.endsWith(file.path, ipv4FileName)) {
      await write(ipv4FilePath, file.stream());
    }
    if (_.endsWith(file.path, ipv6FileName)) {
      await write(ipv6FilePath, file.stream());
    }
  }
}

async function write(pathname, stream) {
  return new Promise((resolve, reject) => {
    stream.pipe(fs.createWriteStream(pathname)).on("error", reject).on("finish", resolve);
  });
}

async function parseLocationData(csvReadStream) {
  return new Promise((resolve, reject) => {
    const result = {};
    let first = false;
    const blockReader = readline.createInterface({
      input: csvReadStream,
    });

    blockReader
      .on("line", (line) => {
        /* eslint-disable */
        const [
          geonameId,
          localeCode,
          continentCode,
          continentName,
          countryISOCode,
          countryName,
          subdivision1ISOCode,
          subdivision1Name,
          subdivision2ISOCode,
          subdivision2Name,
          cityName,
          metroCode,
          timeZone,
        ] = csv.parse(line)[0];
        /* eslint-enable */

        if (first) {
          first = false;
          if (
            geonameId === "geoname_id" &&
            countryName === "country_name" &&
            subdivision1Name === "subdivision_1_name" &&
            subdivision2Name === "subdivision_2_name"
          ) {
            return;
          }
          throw new Error("Unexpected CSV headers in locations file:" + line);
        }

        result[geonameId] = {
          geonameId,
          country: countryName,
          subdiv1: subdivision1Name,
          subdiv2: subdivision2Name,
          timeZone,
        };
      })
      .on("error", reject)
      .on("close", () => resolve(result));
  });
}

async function translateIPBlockData(csvReadStream, locations, date) {
  return new Promise((resolve, reject) => {
    const insertBatchSize = 1000;
    const blockReader = readline.createInterface({
      input: csvReadStream,
    });
    let queuedValues: any[] = [];
    let first = true;

    blockReader
      .on("line", (line) => {
        /* eslint-disable */
        const [
          network,
          geonameId,
          registeredCountryGeonameId,
          representedCountryGeonameId,
          isAnonymousProxy,
          isSatelliteProvider,
          postalCode,
          latitude,
          longitude,
          accuracyRadius,
        ] = csv.parse(line)[0];
        /* eslint-enable */

        if (first) {
          first = false;
          if (
            network === "network" &&
            geonameId === "geoname_id" &&
            latitude === "latitude" &&
            longitude === "longitude"
          ) {
            return;
          }
          throw new Error("Unexpected CSV headers in block file: " + line);
        }

        const loc = locations[geonameId];
        const values = [
          network,
          latitude ? parseFloat(latitude) : null,
          longitude ? parseFloat(longitude) : null,
          (loc && loc.country) || "unknown",
          (loc && loc.subdiv1) || "unknown",
          (loc && loc.subdiv2) || "unknown",
          (loc && loc.timeZone) || "unknown",
          date,
        ];

        queuedValues.push(values);
        if (queuedValues.length === insertBatchSize) {
          flush()
            .then(() => {
              blockReader.resume();
            })
            .catch((err) => {
              logger.error(err);
              blockReader.close();
              reject(err);
            });
        }
      })
      .on("close", () => {
        if (queuedValues.length) {
          flush().then(resolve).catch(reject);
        }
      })
      .on("error", reject);

    function flush() {
      const valuesString = queuedValues
        .map((v, i) => {
          const offset = i * 8;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${
            offset + 6
          }, $${offset + 7}, $${offset + 8})`;
        })
        .join(",");

      const ultraString = `insert into geoip (network, lat, lon, country, subdiv1, subdiv2, timezone, synced) values ${valuesString} on conflict (network) do update set lat = excluded.lat, lon = excluded.lon, country = excluded.country, subdiv1 = excluded.subdiv1, subdiv2 = excluded.subdiv2, timezone = excluded.timezone, synced = excluded.synced;`;

      const params = _.flatten(queuedValues);
      queuedValues = [];
      return pgPool.query(ultraString, params);
    }
  });
}

// Delete geoip records not synced within two days of date. (If the job is
// running at midnight some records from this batch could be 1 day old.)
async function clean(date) {
  await pgPool.query(`delete from geoip where synced is null or synced < ($1::date - interval '2 days')`, [
    date,
  ]);
}
