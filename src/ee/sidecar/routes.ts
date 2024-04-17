import healthcheck from "./handlers/healthcheck";

export default function setupRoutes(app) {
  app.get("/api/v1/health", healthcheck);
}
