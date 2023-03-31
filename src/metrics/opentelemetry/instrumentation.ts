import otel, {
  type Histogram,
  type ObservableGauge,
  type Attributes,
  type Counter,
} from "@opentelemetry/api";
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import config from "../../config";

if (process.env.NODE_ENV !== "test") {
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
}

let counters;
let gauges;
let histograms;

const initOtelInstruments = () => {
  const otelMeter = otel.metrics.getMeter("retraced-meter");

  counters = {
    "EventCreater.handled.events": otelMeter.createCounter("EventCreater.handled.events"),
    "ElasticsearchIndexRotator.createWriteIndexIfNecessary.performRepair": otelMeter.createCounter(
      "ElasticsearchIndexRotator.createWriteIndexIfNecessary.performRepair"
    ),
    "processor.waitForJobs.errors": otelMeter.createCounter("processor.waitForJobs.errors"),
    "Emailer.mandrillRejectHandler": otelMeter.createCounter("Emailer.mandrillRejectHandler"),
    "NSQClient.forceReconnect.destroy": otelMeter.createCounter("NSQClient.forceReconnect.destroy"),
    "PgPool.connection.error": otelMeter.createCounter("PgPool.connection.error"),
    "method.errors": otelMeter.createCounter("method.errors"),
  };
  gauges = {
    "PgPool.clients.waiting.count": otelMeter.createObservableGauge("PgPool.clients.waiting.count"),
    "PgPool.clients.total.count": otelMeter.createObservableGauge("PgPool.clients.total.count"),
    "PgPool.clients.idle.count": otelMeter.createObservableGauge("PgPool.clients.idle.count"),
    "PgPool.clients.active.count": otelMeter.createObservableGauge("PgPool.clients.active.count"),
  };
  histograms = {
    "ElasticsearchIndexRotator.createWriteIndexIfNecessary.multipleWriteAliases": otelMeter.createHistogram(
      "ElasticsearchIndexRotator.createWriteIndexIfNecessary.multipleWriteAliases"
    ),
    "NormalizeRepairer.repairOldEvents.oldest": otelMeter.createHistogram(
      "NormalizeRepairer.repairOldEvents.oldest",
      { unit: "ms" }
    ),
    "NormalizeRepairer.repairOldEvents.age": otelMeter.createHistogram(
      "NormalizeRepairer.repairOldEvents.age",
      { unit: "ms" }
    ),
    "workers.saveEventToElasticSearch.latencyCreated": otelMeter.createHistogram(
      "workers.saveEventToElasticSearch.latencyCreated",
      { unit: "ms" }
    ),
    "workers.saveEventToElasticSearch.latencyReceived": otelMeter.createHistogram(
      "workers.saveEventToElasticSearch.latencyReceived",
      { unit: "ms" }
    ),
    "workers.streamEvent.latencyCreated": otelMeter.createHistogram("workers.streamEvent.latencyCreated", {
      unit: "ms",
    }),
    "workers.streamEvent.latencyReceived": otelMeter.createHistogram("workers.streamEvent.latencyReceived", {
      unit: "ms",
    }),
    "NSQClient.produce.errorPct": otelMeter.createHistogram("NSQClient.produce.errorPct"),
    "method.executionTime": otelMeter.createHistogram("method.executionTime", { unit: "ns" }),
  };
};

const incrementOtelCounter = (name: string, inc = 1, metricAttributes?: Attributes) => {
  const counter: Counter = counters[name];
  if (counter) {
    counter.add(inc, metricAttributes);
  }
};

const recordOtelHistogram = (name: string, val: number, metricAttributes?: Attributes) => {
  const histogram: Histogram = histograms[name];
  if (histogram) {
    histogram.record(val, metricAttributes);
  }
};

const observeOtelGauge = (name: string, val: number, metricAttributes?: Attributes) => {
  const gauge: ObservableGauge = gauges[name];
  if (gauge) {
    gauge.addCallback((result) => {
      result.observe(val, metricAttributes);
    });
  }
};

export { initOtelInstruments, incrementOtelCounter, recordOtelHistogram, observeOtelGauge };
