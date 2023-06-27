import { spawn } from "child_process";
import { ReaderModel, Reader, City } from "@maxmind/geoip2-node";
import config from "../config";
import fs from "fs";
import { logger } from "../logger";

let reader: ReaderModel;

export const mmdbExists = () => {
  return fs.existsSync(config.GEO_MMDB_PATH);
};

export const execGeoipUpdate = async () => {
  return new Promise((resolve, reject) => {
    // const command = "/opt/homebrew/bin/geoipupdate";
    // const args = [
    //   "-f",
    //   "/Users/deepak/workspace/retraced/GeoIP.conf",
    //   "-d",
    //   "/Users/deepak/workspace/retraced/mmdb",
    // ];
    const command = "/usr/bin/geoipupdate";
    const args = ["-f", "/etc/GeoIP.conf", "-d", "/etc/mmdb"];

    const child = spawn(command, args);

    child.stdout.on("data", (data) => {
      logger.info(`stdout: ${data}`);
    });

    child.stderr.on("data", (data) => {
      logger.info(`stderr: ${data}`);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        logger.info(`GeoIP update process exited with code ${code}`);
        reject(new Error(`GeoIP update process exited with code ${code}`));
      } else {
        logger.info(`GeoIP update done!`);
        resolve(undefined);
      }
    });
  });
};

export const queryMMDB = (ip: string) => {
  if (mmdbExists()) {
    reader = getMMDBReader();

    const response: City = reader.city(ip);
    return response;
  } else {
    logger.info(`MMDB file not found at ${config.GEO_MMDB_PATH}`);
    return null;
  }
};

const getMMDBReader = (): ReaderModel => {
  if (!reader) {
    const dbBuffer = fs.readFileSync(config.GEO_MMDB_PATH);

    // This reader object should be reused across lookups as creation of it is
    // expensive.
    reader = Reader.openBuffer(dbBuffer);
  }
  return reader;
};
