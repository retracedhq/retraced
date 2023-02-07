import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

const name = "heartbeat";

export async function getAnalyticsId(): Promise<{ uuid: string; sent: string }> {
  const fields = `name, uuid, sent`;
  const q = `select ${fields} from analytics where name = '${name}'`;

  const result = await pgPool.query(q);
  if (result.rowCount > 0) {
    console.log(result.rows[0].run_at, typeof result.rows[0].run_at, result.rows[0]);
    if ((result.rows[0] as any).name !== "") {
      return { uuid: (result.rows[0] as any).uuid as string, sent: (result.rows[0] as any).sent as string };
    } else {
      // create record
    }
  }

  return { uuid: "", sent: "" };
}

export async function createAnalyticsId(uuid: string): Promise<void> {
  let q;
  let v;
  q = `update analytics set uuid = $1 where name = '${name}'`;
  v = [uuid];

  await pgPool.query(q, v);
}

export async function updateRunAt(sent: string): Promise<void> {
  let q;
  let v;
  q = `update  analytics set sent = $1::timestamp where name = '${name}'`;
  v = [sent];

  await pgPool.query(q, v);
}
