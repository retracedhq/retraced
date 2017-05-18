import getElasticsearch from "../../persistence/elasticsearch";

const es = getElasticsearch();

interface Options {
  projectId: string;
  environmentId: string;
}

export default async function (opts: Options): Promise<boolean> {
  return await new Promise<boolean>((resolve, reject) => {
    const aliasName = `retraced.${opts.projectId}.${opts.environmentId}`;
    es.cat.aliases({ format: "json", name: aliasName }, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }

      if (!Array.isArray(resp) || resp.length === 0) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}
