import * as StatsdClient from "statsd-client";

import { StatsdReporter, StatusPageReporter, SysdigNameRewriter, getRegistry } from "monkit";

export function startStatsdReporter(
    statsdHost: string,
    statsdPort: number,
    intervalMs: number,
) {
    console.log(`starting statsd reporter ${statsdHost}:${statsdPort} at interval ${intervalMs}ms`);
    const rewriter = new SysdigNameRewriter(SysdigNameRewriter.CLASS_METHOD_METRIC_AGGREGATION);

    const reporter = new StatsdReporter(
        getRegistry(),
        "",
        new StatsdClient({host: statsdHost, port: statsdPort}),
        rewriter.rewriteName.bind(rewriter),
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
        getRegistry(),
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
        "EventCreater.createEvent.timer.mean": "whb4rfgv5fzv",
        "EventCreater.createEvent.timer.p98": "stkhk01nkb4f",
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
