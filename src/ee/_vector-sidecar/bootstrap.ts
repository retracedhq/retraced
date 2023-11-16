import getPgPool from "../../persistence/pg";
import { addConfigFromSinkRow } from "./services/vector";

const pg = getPgPool();

(async () => {
  let sinks;
  do {
    try {
      sinks = await pg.query(`SELECT * FROM vectorsink`);
      break;
    } catch (ex) {
      console.log("[Bootstrap]", ex ? (ex.message ? ex.message : ex) : ex, `Retrying...`);
      continue;
    }
  } while (true);
  for (const sink of sinks.rows) {
    try {
      await addConfigFromSinkRow(sink, false);
    } catch (ex) {
      console.log("[Bootstrap]", ex ? (ex.message ? ex.message : ex) : ex, `Continuing...`);
      continue;
    }
  }
  process.exit(0);
})();
