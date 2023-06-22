import { spawn } from "child_process";
import { ReaderModel, Reader, City } from "@maxmind/geoip2-node";
import config from "../config";
import fs from "fs";

let reader: ReaderModel;

export const execGeoipUpdate = () => {
  const command = "/usr/bin/geoipupdate";
  const args = ["-f", "/etc/GeoIP.conf", "-d", "/etc/mmdb", "-v"];

  const child = spawn(command, args);

  child.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

export const queryMMDB = (ip: string) => {
  const dbBuffer = fs.readFileSync(config.MMDB_PATH);

  // This reader object should be reused across lookups as creation of it is
  // expensive.
  reader = getMMDBReader();

  const response: City = reader.city(ip);
  return response;
};

const getMMDBReader = (): ReaderModel => {
  if (!reader) {
    const dbBuffer = fs.readFileSync(config.MMDB_PATH);

    // This reader object should be reused across lookups as creation of it is
    // expensive.
    reader = Reader.openBuffer(dbBuffer);
  }
  return reader;
};
