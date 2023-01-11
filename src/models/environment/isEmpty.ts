import { Client } from "@elastic/elasticsearch";
import { getNewElasticsearch } from "../../persistence/elasticsearch";

const newEs: Client = getNewElasticsearch();

interface Options {
  projectId: string;
  environmentId: string;
}

export default async function (opts: Options): Promise<boolean> {
  return await new Promise<boolean>((resolve, reject) => {
    const aliasName = `retraced.${opts.projectId}.${opts.environmentId}`;
    newEs.cat.aliases({ format: "json", name: aliasName }, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }

      if (!Array.isArray(resp.body) || resp.body.length === 0) {
        resolve(true);
        return;
      }

      // See if index has any items in it.
      newEs.count({ index: aliasName }, (err2, resp2) => {
        if (err2) {
          reject(err2);
          return;
        }

        resolve(resp2.body.count === 0);
      });
    });
  });
}
