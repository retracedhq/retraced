export const Endpoint =
  process.env.PUBLISHER_API_ENDPOINT || "http://localhost:3000/auditlog";
export const ProjectID = process.env.PROJECT_ID || "dev";
export const EnvironmentID = process.env.ENVIRONMENT_ID || "dev";
export const ApiKey =
  process.env.PUBLISHER_API_KEY || process.env.ADMIN_ROOT_TOKEN || "dev";
export const EsIndexWaitMs = Number(process.env.ES_INDEX_WAIT_MS || "2000");
export const Debug = process.env.QA_INTEGRATION_DEBUG;
export const AdminRootToken = process.env.ADMIN_ROOT_TOKEN;
export const HeadlessApiKey = process.env.HEADLESS_API_KEY || "";
export const HeadlessProjectID = process.env.HEADLESS_PROJECT_ID || "";
