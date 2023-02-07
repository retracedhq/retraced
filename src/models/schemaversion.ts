import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

export async function getAnalyticsId(): Promise<{ name: string; sent: string }> {
  const fields = `version, name, run_at`;
  const q = `select ${fields} from schemaversion where version = 0`;

  const result = await pgPool.query(q);
  if (result.rowCount > 0) {
    console.log(result.rows[0].run_at, typeof result.rows[0].run_at, result.rows[0]);
    if ((result.rows[0] as any).name !== "") {
      return { name: (result.rows[0] as any).name as string, sent: (result.rows[0] as any).run_at as string };
    } else {
    }
  }

  return { name: "", sent: "" };
}

export async function createAnalyticsId(id: string): Promise<void> {
  let q;
  let v;
  q = `update schemaversion set name = $1 where version = 0`;
  v = [id];

  await pgPool.query(q, v);
}

export async function updateRunAt(sent: string): Promise<void> {
  console.log("updateRunAt", sent);
  let q;
  let v;
  q = `update  schemaversion set run_at = $1::timestamp where version = 0`;
  v = [sent];

  await pgPool.query(q, v);
}
