import {
  type CounterOperationParams,
  type InstrumentOperationParams,
  incrementCounter,
  instrument,
  instrumented,
  observeGauge,
  recordHistogram,
} from "@boxyhq/metrics";

const METER = "retraced";

const counters = {
  "EventCreater.handled.events": ({ inc, counterAttributes }: Partial<CounterOperationParams>) =>
    incrementCounter({ meter: METER, name: "EventCreater.handled.events", inc, counterAttributes }),
  "ElasticsearchIndexRotator.createWriteIndexIfNecessary.performRepair": ({
    inc,
    counterAttributes,
  }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "ElasticsearchIndexRotator.createWriteIndexIfNecessary.performRepair",
      inc,
      counterAttributes,
    }),
  "NormalizeRepairer.repairOldEvents.hits": ({ inc, counterAttributes }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "NormalizeRepairer.repairOldEvents.hits",
      inc,
      counterAttributes,
    }),
  "NormalizeRepairer.repairOldEvents.allClear": ({
    inc,
    counterAttributes,
  }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "NormalizeRepairer.repairOldEvents.allClear",
      inc,
      counterAttributes,
    }),
  "processor.waitForJobs.errors": ({ inc, counterAttributes }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "processor.waitForJobs.errors",
      inc,
      counterAttributes,
    }),
  "Emailer.mandrillRejectHandler": ({ inc, counterAttributes }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "Emailer.mandrillRejectHandler",
      inc,
      counterAttributes,
    }),
  "NSQClient.forceReconnect.destroy": ({ inc, counterAttributes }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "NSQClient.forceReconnect.destroy",
      inc,
      counterAttributes,
    }),
  "PgPool.connection.error": ({ inc, counterAttributes }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "PgPool.connection.error",
      inc,
      counterAttributes,
    }),
  "method.errors": ({ inc, counterAttributes }: Partial<CounterOperationParams>) =>
    incrementCounter({
      meter: METER,
      name: "method.errors",
      inc,
      counterAttributes,
    }),
};

const incrementOtelCounter = (
  action: keyof typeof counters,
  inc?: number,
  counterAttributes?: CounterOperationParams["counterAttributes"]
) => {
  const counterIncrement = counters[action];
  if (typeof counterIncrement === "function") {
    counterIncrement({ inc, counterAttributes });
  }
};

const gauges = {
  "PgPool.clients.waiting.count": (val: number) =>
    observeGauge({ meter: METER, name: "PgPool.clients.waiting.count", val }),
  "PgPool.clients.total.count": (val: number) =>
    observeGauge({ meter: METER, name: "PgPool.clients.total.count", val }),
  "PgPool.clients.idle.count": (val: number) =>
    observeGauge({ meter: METER, name: "PgPool.clients.idle.count", val }),
  "PgPool.clients.active.count": (val: number) =>
    observeGauge({ meter: METER, name: "PgPool.clients.active.count", val }),
};

const observeOtelGauge = (action: keyof typeof gauges, val: number) => {
  const gaugeObserve = gauges[action];
  if (typeof gaugeObserve === "function") {
    gaugeObserve(val);
  }
};

const histograms = {
  "ElasticsearchIndexRotator.createWriteIndexIfNecessary.multipleWriteAliases": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "ElasticsearchIndexRotator.createWriteIndexIfNecessary.multipleWriteAliases",
      val,
    }),
  "NormalizeRepairer.repairOldEvents.oldest": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "NormalizeRepairer.repairOldEvents.oldest",
      val,
      histogramOptions: { unit: "ms" },
    }),
  "NormalizeRepairer.repairOldEvents.age": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "NormalizeRepairer.repairOldEvents.age",
      val,
      histogramOptions: { unit: "ms" },
    }),
  "workers.saveEventToElasticSearch.latencyCreated": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "workers.saveEventToElasticSearch.latencyCreated",
      val,
      histogramOptions: { unit: "ms" },
    }),
  "workers.saveEventToElasticSearch.latencyReceived": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "workers.saveEventToElasticSearch.latencyReceived",
      val,
      histogramOptions: { unit: "ms" },
    }),
  "workers.streamEvent.latencyCreated": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "workers.streamEvent.latencyCreated",
      val,
      histogramOptions: { unit: "ms" },
    }),
  "workers.streamEvent.latencyReceived": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "workers.streamEvent.latencyReceived",
      val,
      histogramOptions: { unit: "ms" },
    }),
  "method.executionTime": (val: number) =>
    recordHistogram({
      meter: METER,
      name: "method.executionTime",
      val,
      histogramOptions: { unit: "ms" },
    }),
};

const recordOtelHistogram = (action: keyof typeof histograms, val: number) => {
  const histogramRecord = histograms[action];
  if (typeof histogramRecord === "function") {
    histogramRecord(val);
  }
};

const instruments = {
  "PgPool.connect": async (delegate) => await instrument({ meter: METER, name: "PgPool.connect", delegate }),
  "EventCreater.insertMany": async (delegate) =>
    await instrument({ meter: METER, name: "EventCreater.insertMany", delegate }),
  "EventCreater.insertOne": async (delegate) =>
    await instrument({ meter: METER, name: "EventCreater.insertOne", delegate }),
  "EventCreater.insertOneIntoBacklog": async (delegate) =>
    await instrument({ meter: METER, name: "EventCreater.insertOneIntoBacklog", delegate }),
  processor: async (delegate, instrumentAttributes?: InstrumentOperationParams["instrumentAttributes"]) =>
    await instrument({ meter: METER, name: "processor", delegate, instrumentAttributes }),
  "adminToken.bcrypt": async (delegate) =>
    await instrument({ meter: METER, name: "adminToken.bcrypt", delegate }),
  "Elasticsearch.countBy": async (delegate) =>
    await instrument({ meter: METER, name: "Elasticsearch.countBy", delegate }),
};

const applyOtelInstrument = async (
  action: keyof typeof instruments,
  delegate,
  instrumentAttributes?: InstrumentOperationParams["instrumentAttributes"]
) => {
  const instrumentApply = instruments[action];
  if (typeof instrumentApply === "function") {
    return await instrumentApply(delegate, instrumentAttributes);
  }
};

const retracedInstrumented = instrumented(METER);

export {
  incrementOtelCounter,
  recordOtelHistogram,
  observeOtelGauge,
  applyOtelInstrument,
  retracedInstrumented as instrumented,
};
