import packageInfo from "../../package.json";
import { initializeMetrics } from "@boxyhq/metrics";

/** OpenTelemetry init */
initializeMetrics({ name: packageInfo.name, version: packageInfo.version });
