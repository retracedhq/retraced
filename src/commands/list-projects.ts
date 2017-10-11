import * as util from "util";
import getPgPool from "../persistence/pg";

exports.name = "list-projects";
exports.describe = "list the current projects";

function listProject(): Promise<any> {
  const pgPool = getPgPool();
  return pgPool.query(`select * from project`);
}

exports.handler = async (argv) => {
  listProject()
      .then((res) => {
        console.log(`rows: ${util.inspect(res.rows)}`);
        process.exit(0);
      })
      .catch((err) => {
        console.log(util.inspect(err));
        process.exit(1);
      });
};
