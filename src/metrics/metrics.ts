import "source-map-support/register";
import * as metrics from "metrics";
import * as _ from "lodash";
import * as chalk from "chalk";
import * as statsd from "node-statsd-client";
import StatsdReporter from "./StatsdReporter";
import StatusPageReporter from "./StatusPageReporter";

const toOpsPerMin = (rate) => rate * 60;
const toMs = (nanos) => nanos / 1000000;

const report = new metrics.Report();

export function meter(name: string) {
    return getOrCreate(name, metrics.Meter);
}

export function timer(name: string) {
    return getOrCreate(name, metrics.Timer);
}

export function histogram(name: string) {
    return getOrCreate(name, metrics.Histogram);
}

export function counter(name: string) {
    return getOrCreate(name, metrics.Counter);
}

function getOrCreate(name: string, ctor: ObjectConstructor) {

    if (!report.getMetric(name)) {
        report.addMetric(name, new ctor());
    }

    return report.getMetric(name);
}

export function getReport() {
    return report;
};

/**
 * TypeScript decorator for adding
 * throughput, latency, and error monitoring
 * to a method.
 *
 * @param target
 * @param key
 * @param descriptor
 */
export function instrumented(target: any, key: string, descriptor: PropertyDescriptor) {
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    let originalMethod = descriptor.value;
    const klass = target.constructor.name;
    const t = timer(`${klass}.${key}`);
    const errors = meter(`${klass}.${key}.errors`);
    console.log(`@instrumented decorator processing ${chalk.green(klass)}.${chalk.green(key)}`);

    // this needs to be a non-arrow function or we'll get the wrong `this`
    function overrideMethod() {
        return instrument(t, errors, async () => {
            return await originalMethod.apply(this, arguments);
        });
    }

    descriptor.value = overrideMethod;

    return descriptor;
}

/**
 * Run the given function, recording throughput, latency and errors
 *
 * @param timer      a metrics.Timer
 * @param errorMeter a metrics.Meter
 * @param delegate   the function to run
 */
export async function instrument(
    timer: metrics.Timer,
    errorMeter: metrics.Meter,
    delegate: Function,
) {
    const start = process.hrtime();
    try {
        return await delegate();
    } catch (err) {
        errorMeter.mark();
        throw err;
    } finally {
        const elapsed = process.hrtime(start);
        const elapsedNanos = (elapsed[0] * 1000000000) + elapsed[1];
        timer.update(elapsedNanos);
    }
};

/**
 * This code is copypasta'd from one of the node `metrics` reporters
 * its basically turning
 * ```
 * {
 *   a: {
 *     b: { count: 10 },
 *     c: { count: 20 },
 *   foo: {
 *     bar: { count: 30 }
 *   }
 * }
 * ```
 *
 * into
 * ```
 * {
 *   counters: [
 *     { name: a.b, count: 10 },
 *     { name: a.c, count: 20},
 *     { name: foo.bar, count: 30}
 *   ]
 * }
 * ```
 */
export function getNamedMetrics(registry: metrics.Report) {

    let meters: any[] = [];
    let timers: any[] = [];
    let counters: any[] = [];
    let histograms: any[] = [];

    let trackedMetrics = registry.trackedMetrics;
    // Flatten metric name to be namespace.name is has a namespace and separate out metrics
    // by type.
    for (let namespace of Object.keys(trackedMetrics)) {
        for (let name of Object.keys(trackedMetrics[namespace])) {
            let metric = trackedMetrics[namespace][name];
            if (namespace.length > 0) {
                metric.name = namespace + "." + name;
            } else {
                metric.name = name;
            }
            let metricType = Object.getPrototypeOf(metric);
            if (metricType === metrics.Meter.prototype) {
                meters.push(metric);
            } else if (metricType === metrics.Timer.prototype) {
                timers.push(metric);
            } else if (metricType === metrics.Counter.prototype) {
                counters.push(metric);
            } else if (metricType === metrics.Histogram.prototype) {
                histograms.push(metric);
            }
        }
    }

    return { meters, timers, counters, histograms };
}

/**
 * A custom reporter that sends metrics to a statsd server over udp.
 * Used to, among other things, report metrics to sysdig agent running in kubernetes.
 *
 * This class borrows a lot from the `GraphiteReporter` in the `metrics` package
 * @param {Report} registry report instance whose metrics to report on.
 * @param {String} prefix A string to prefix on each metric (i.e. app.hostserver)
 * @param {String} host The ip or hostname of the target statsd server.
 * @param {String} port The port graphite is running on, defaults to 8125 if not specified.
 */

export function startStatsdReporter(
    statsdHost: string,
    statsdPort: string,
    intervalMs: number,
) {
    console.log(`starting statsd reporter ${statsdHost}:${statsdPort} at interval ${intervalMs}ms`);

    const reporter = new StatsdReporter(
        getReport(),
        "",
        statsdHost,
        statsdPort,
    );
    console.log("created");

    setInterval(() => { reporter.report(); }, intervalMs);
    console.log("started");
};

export function startStatusPageReporter(
    url: string,
    pageId: string,
    statusPageToken: string,
    metricIds: any,
    intervalMs: number,
) {
    console.log(`starting statusPage reporter ${url}/${pageId} at interval ${intervalMs}ms`);

    const reporter = new StatusPageReporter(
        getReport(),
        url,
        pageId,
        statusPageToken,
        metricIds,
    );
    console.log("created");

    setInterval(() => { reporter.report(); }, intervalMs);
    console.log("started");
};

export function bootstrapFromEnv() {
    const statsdHost = process.env.KUBERNETES_SERVICE_HOST || process.env.STATSD_HOST;
    const statsdPort = process.env.STATSD_PORT || 8125;
    const statsdIntervalMillis = process.env.STATSD_INTERVAL_MILLIS || 30000;

    if (!statsdHost) {
        console.error("neither KUBERNETES_SERVICE_HOST nor STATSD_HOST is set, metrics will not be reported to statsd or sysdig");
    } else {
        startStatsdReporter(statsdHost, statsdPort, statsdIntervalMillis);
    }

    const statusPageToken = process.env.STATUSPAGEIO_TOKEN;
    const statusPagePageId = process.env.STATUSPAGEIO_PAGE_ID || "2d8w7krf3x52"; // Retraced API
    const statusPageUrl = process.env.STATUSPAGEIO_URL || "api.statuspage.io";
    const intervalMs = process.env.STATUSPAGEIO_INTERVAL_MILLIS || 30000;
    const metricIds = {
        "EventCreater.createEvent.p50": "whb4rfgv5fzv",
        "EventCreater.createEvent.errors.m1_rate": "xgntq7qsk0cl",
    };

    if (!(statusPageToken)) {
        console.error("STATUSPAGEIO_TOKEN not set, metrics will not be reported to statuspage.io");
        return;
    }

    startStatusPageReporter(
        statusPageUrl,
        statusPagePageId,
        statusPageToken,
        metricIds,
        intervalMs,
    );

}

export { toOpsPerMin, toMs }
