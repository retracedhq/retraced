import StatsdClient from "statsd-client";
import { getRegistry, StatsdReporter, StatusPageReporter, SysdigNameRewriter } from "monkit";
import { logger } from "./logger";
import config from '../config';

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
        new StatsdClient({host: statsdHost, port: statsdPort}),
        rewrite ? rewriter.rewriteName.bind(rewriter) : (s) => s,
    );
    logger.info("created");

    setInterval(() => { reporter.report(); }, intervalMs);
    logger.info("started");
}
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

    setInterval(() => { reporter.report(); }, intervalMs);

    logger.info("started");
}

export function bootstrapFromEnv() {
    const statsdHost = config.STATSD_HOST || config.KUBERNETES_SERVICE_HOST;
    const statsdPort = Number(config.STATSD_PORT) || 8125;
    const statsdIntervalMillis = Number(config.STATSD_INTERVAL_MILLIS) || 30000;
    const statsdPrefix = config.STATSD_PREFIX || "";
    const sysdigRewriter = Boolean(config.STATSD_USE_SYSDIG_NAME_REWRITER) || false;

    if (!statsdHost) {
        logger.error("neither KUBERNETES_SERVICE_HOST nor STATSD_HOST is set, metrics will not be reported to statsd or sysdig");
    } else {
        startStatsdReporter(statsdHost, statsdPort, statsdIntervalMillis, statsdPrefix, sysdigRewriter);
    }

    const statusPageToken = config.STATUSPAGEIO_TOKEN;
    const statusPagePageId = config.STATUSPAGEIO_PAGE_ID || "2d8w7krf3x52"; // Retraced API
    const statusPageUrl = config.STATUSPAGEIO_URL || "api.statuspage.io";
    const intervalMs = Number(config.STATUSPAGEIO_INTERVAL_MILLIS) || 30000;
    const metricIds = {
        "workers.saveEventToElasticSearch.latencyCreated.mean": "gmwxt3r6mw2m",
        "workers.saveEventToElasticSearch.latencyCreated.p98": "r9hjcyp0dp7j",
        "workers.saveEventToElasticSearch.latencyReceived.mean": "4ny8dqqykcfw",
        "workers.saveEventToElasticSearch.latencyReceived.p98": "rgf4cczqjv2f",
        "workers.streamEvent.latencyReceived.mean": "scm8dhjpzkfx",
        "workers.streamEvent.latencyReceived.p98": "strb220gdt5t",
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
