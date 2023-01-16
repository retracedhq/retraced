import util from "util";
import getPgPool from "../persistence/pg";

export const name = "list-projects";
export const describe = "list the current projects";
export const builder = {};

function listProject(): Promise<any> {
  const pgPool = getPgPool();
  return pgPool.query(`select * from project`);
}

export const handler = async () => {
  try {
    const res = await listProject();

    console.log(`rows: ${util.inspect(res.rows)}`);
    process.exit(0);
  } catch (err: any) {
    console.log(util.inspect(err));
    process.exit(1);
  }
};
