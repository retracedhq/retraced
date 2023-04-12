import config from "../../config";
import type { Job } from "./normalizeEvent";
import { indexEvent, saveEventToElasticsearch } from ".";

export default async function indexEventToDataStore(job: Job) {
  if (config.PG_SEARCH) {
    await indexEvent(job);
  } else {
    await saveEventToElasticsearch(job);
  }
}
