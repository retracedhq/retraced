import * as util from "util";
import getPgPool from "../persistence/pg";

exports.name = "list-environments";
exports.describe = "list the current environments";

function list(): Promise<any> {
  const pgPool = getPgPool();
  return pgPool.query(`select * from environment`);
}

exports.handler = async (argv) => {
  list()
      .then((res) => {
        console.log(`rows: ${util.inspect(res.rows)}`);
        process.exit(0);
      })
      .catch((err) => {
        console.log(util.inspect(err));
        process.exit(1);
      });
};
