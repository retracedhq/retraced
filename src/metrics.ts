import * as StatsdClient from "statsd-client";
import * as Prometheus from "prom-client";

import {
    gauge as monkitGauge,
    getRegistry,
    histogram as monkitHistogram,
    meter as monkitMeter,
    StatsdReporter,
    StatusPageReporter,
    SysdigNameRewriter,
    timer as monkitTimer,
} from "monkit";
import { logger } from "./logger";

export function startStatsdReporter(
    statsdHost: string,
    statsdPort: number,
    intervalMs: number,
    prefix: string,
    rewrite: boolean,
) {
    logger.info(`starting statsd reporter ${statsdHost}:${statsdPort} at interval ${intervalMs}ms`);
    const rewriter = new SysdigNameRewriter(SysdigNameRewriter.CLASS_METHOD_METRIC_AGGREGATION);

    const reporter = new StatsdReporter(
        getRegistry(),
        prefix,
        new StatsdClient({ host: statsdHost, port: statsdPort }),
        rewrite ? rewriter.rewriteName.bind(rewriter) : (s) => s,
    );
    logger.info("created");

    setInterval(() => {
        reporter.report();
    }, intervalMs);
    logger.info("started");
};

export function startStatusPageReporter(
    url: string,
    pageId: string,
    statusPageToken: string,
    metricIds: any,
    intervalMs: number,
) {
    logger.info(`starting statusPage reporter ${url}/${pageId} at interval ${intervalMs}ms`);

    const reporter = new StatusPageReporter(
        getRegistry(),
        url,
        pageId,
        statusPageToken,
        metricIds,
    );
    logger.info("created");

    setInterval(() => {
        reporter.report();
    }, intervalMs);
    logger.info("started");
};

export function bootstrapFromEnv() {
    const statsdHost = process.env.STATSD_HOST || process.env.KUBERNETES_SERVICE_HOST;
    const statsdPort = Number(process.env.STATSD_PORT) || 8125;
    const statsdIntervalMillis = Number(process.env.STATSD_INTERVAL_MILLIS) || 30000;
    const statsdPrefix = process.env.STATSD_PREFIX || "";
    const sysdigRewriter = Boolean(process.env.STATSD_USE_SYSDIG_NAME_REWRITER) || false;

    if (!statsdHost) {
        logger.error("neither KUBERNETES_SERVICE_HOST nor STATSD_HOST is set, metrics will not be reported to statsd or sysdig");
    } else {
        startStatsdReporter(statsdHost, statsdPort, statsdIntervalMillis, statsdPrefix, sysdigRewriter);
    }

    const statusPageToken = process.env.STATUSPAGEIO_TOKEN;
    const statusPagePageId = process.env.STATUSPAGEIO_PAGE_ID || "2d8w7krf3x52"; // Retraced API
    const statusPageUrl = process.env.STATUSPAGEIO_URL || "api.statuspage.io";
    const intervalMs = Number(process.env.STATUSPAGEIO_INTERVAL_MILLIS) || 30000;
    const metricIds = {
        "EventCreater.createEvent.timer.p50": "whb4rfgv5fzv",
        "EventCreater.createEvent.timer.p98": "stkhk01nkb4f",
        "EventCreater.createEvent.errors.m1_rate": "xgntq7qsk0cl",
    };

    if (!(statusPageToken)) {
        logger.error("STATUSPAGEIO_TOKEN not set, metrics will not be reported to statuspage.io");
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

export function instrumented(target: any, key: string, descriptor?: PropertyDescriptor) {
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    if (descriptor === undefined) {
        return descriptor;
    }

    let originalMethod = descriptor.value;
    const klass = target.constructor.name;

    // this needs to be a non-arrow function or we'll get the wrong `this`
    function overrideMethod() {
        const args = arguments;
        return instrument(`${klass}.${key}`, async () => {
            return await originalMethod.apply(this, args);
        });
    }

    descriptor.value = overrideMethod;

    return descriptor;
}

export function histogram(name: string, help?: string, labels?: string[]) {
    if (!process.env.RETRACED_ENABLE_PROMETHEUS) {
        return monkitHistogram(name);
    }

    name = name.replace(/\./g, "_");
    const summary = Prometheus.register.getSingleMetric("summaries") as Prometheus.Summary<string> ||
        new Prometheus.Summary<string>(
            {
                name: name,
                help: help || name,
                labelNames: labels || ["class", "method", "metric"],
                percentiles: [.5, .75, .95, .98, .99, .999],
            }
        );

    // "summaries",
    // help || name,
    // labels || ["class", "method", "metric"],
    // { percentiles: [.5, .75, .95, .98, .99, .999] },

    return {
        update(value: number, obsLabels?: string[]) {
            monkitHistogram(name).update(value);
            summary
                .labels(...(obsLabels || name.split("_")))
                .observe(value);
        },
    };
}

export function timer(name: string, help?: string, labels?: string[]) {
    if (!process.env.RETRACED_ENABLE_PROMETHEUS) {
        return monkitTimer(name);
    }

    name = name.replace(/\./g, "_");

    const times = Prometheus.register.getSingleMetric("summaries") as Prometheus.Summary<string> ||
        new Prometheus.Summary<string>({
            name: name,
            help: help || name,
            labelNames: labels || ["class", "method", "metric"],
            percentiles: [.5, .75, .95, .98, .99, .999],
        });

    const throughput = Prometheus.register.getSingleMetric("counters") as Prometheus.Counter<string> ||
        new Prometheus.Counter<string>({
            name: name,
            help: help || name,
            labelNames: labels || ["class", "method", "metric"],
        });

    return {
        update(nanos: number, obsLabels?: string[]) {
            monkitTimer(name).update(nanos);
            const wl = throughput.labels(...(obsLabels || name.split("_")));
            wl.inc();
            times
                .labels(...(obsLabels || name.split("_")))
                .observe(nanos);
        },
    };
}

export function meter(name: string, help?: string, labels?: string[]) {
    if (!process.env.RETRACED_ENABLE_PROMETHEUS) {
        return monkitMeter(name);
    }

    name = name.replace(/\./g, "_");

    const throughput = Prometheus.register.getSingleMetric("counters") as Prometheus.Counter<string> ||
        new Prometheus.Counter<string>({
            name: name,
            help: help || name,
            labelNames: labels || ["class", "method", "metric"],
        });

    return {
        mark(count?: number, obsLabels?: string[]) {
            monkitMeter(name).mark(count);
            throughput
                .labels(...(obsLabels || name.split("_")))
                .inc(count);
        },
    };
}

export function gauge(name: string, help?: string, labels?: string[]) {
    if (!process.env.RETRACED_ENABLE_PROMETHEUS) {
        return monkitGauge(name);
    }

    name = name.replace(/\./g, "_");

    const gauge = Prometheus.register.getSingleMetric("gauges") as Prometheus.Gauge<string> ||
        new Prometheus.Gauge<string>({
            name: name,
            help: help || name,
            labelNames: labels || ["class", "method", "metric", "aggregation"],
        }

        );

    return {
        set(value: number, obsLabels?: string[]) {
            monkitGauge(name).set(value);
            gauge
                .labels(...(obsLabels || name.split("_")))
                .set(value);
        },
    };
};

/**
 * Run the given function, recording throughput, latency and errors
 */
export async function instrument(
    name: string,
    delegate: Function,
) {
    const t = timer(`${name}.timer`);
    const errors = meter(`${name}.errors`);
    const start = process.hrtime();

    try {
        return await delegate();
    } catch (err) {
        errors.mark();
        throw err;
    } finally {
        const elapsed = process.hrtime(start);
        const elapsedNanos = (elapsed[0] * 1000000000) + elapsed[1];
        t.update(elapsedNanos);
    }
};
