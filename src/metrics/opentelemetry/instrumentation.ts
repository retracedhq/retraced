import otel from "@opentelemetry/api";
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import config from "../../config";

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "retraced",
    // [SemanticResourceAttributes.SERVICE_VERSION]: "0.1.0",
  })
);

const collectorOptions = {
  url: config.LIGHTSTEP_URL, // url is optional and can be omitted - default is http://localhost:4318/v1/metrics
  headers: {
    "Lightstep-Access-Token": config.LIGHTSTEP_TOKEN,
  }, // an optional object containing custom headers to be sent with each request
  concurrencyLimit: 1, // an optional limit on pending requests
};
const metricExporter = new OTLPMetricExporter(collectorOptions);

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,

  exportIntervalMillis: Number(config.LIGHTSTEP_INTERVAL_MILLIS) || 30000,
});

const myServiceMeterProvider = new MeterProvider({
  resource,
});

myServiceMeterProvider.addMetricReader(metricReader);

// Set this MeterProvider to be global to the app being instrumented.
otel.metrics.setGlobalMeterProvider(myServiceMeterProvider);
