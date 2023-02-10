import getPgPool from "../persistence/pg";

const pgPool = getPgPool();

const name = "heartbeat";

async function createAnalyticsId(): Promise<void> {
  const q = `insert into analytics (
    name
  ) values (
    '${name}'
  )`;
  await pgPool.query(q);
}

export async function getAnalyticsId(): Promise<{ uuid: string; sent: string }> {
  const fields = `name, uuid, sent`;
  const q = `select ${fields} from analytics where name = '${name}'`;

  const result = await pgPool.query(q);
  if (result.rowCount > 0) {
    if ((result.rows[0] as any).name !== "") {
      return { uuid: (result.rows[0] as any).uuid as string, sent: (result.rows[0] as any).sent as string };
    }
  } else {
    // create record
    await createAnalyticsId();
  }

  return { uuid: "", sent: "" };
}

export async function updateAnalyticsId(uuid: string): Promise<void> {
  const q = `update analytics set uuid = $1 where name = '${name}'`;
  const v = [uuid];

  await pgPool.query(q, v);
}

export async function updateRunAt(sent: string): Promise<void> {
  const q = `update  analytics set sent = $1::timestamp where name = '${name}'`;
  const v = [sent];

  await pgPool.query(q, v);
}
