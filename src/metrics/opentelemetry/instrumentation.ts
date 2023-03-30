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

const metricExporter = new OTLPMetricExporter();

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: Number(config.OTLP_INTERVAL_MILLIS) || 30000,
});

const meterProvider = new MeterProvider({
  resource,
});

meterProvider.addMetricReader(metricReader);

// Set this MeterProvider to be global to the app being instrumented.
otel.metrics.setGlobalMeterProvider(meterProvider);
