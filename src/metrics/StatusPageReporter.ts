import * as request from "request";
import * as metrics from "metrics";
import * as _ from "lodash";
import * as moment from "moment";
import * as util from "util";
import * as urlencoded from "form-urlencoded";
import { getNamedMetrics, toOpsPerMin, toMs } from "./metrics";

/**
 * Periodically reports metrics to statusPage.
 *
 * This will only report the metrics mapped in `metricIds`.
 * For example, if you want to send the value of
 *
 *     EventCreater.createEvent.mean_rate
 *
 * to a StatusPage metric with id
 *
 *     07cd11baefa0
 *
 * Then you'll want to pass in the mapping:
 *
 *     {
 *         "EventCreater.createEvent.mean_rate": "07cd11baefa0"
 *     }
 */
export default class StatusPageReporter {

    private readonly registry: metrics.Report;
    private readonly url: string;
    private readonly statusPageToken: string;
    private readonly pageId: string;
    private readonly metricIds: any;

    constructor(
        registry: metrics.Report,
        url: string,
        pageId: string,
        statusPageToken: string,
        metricIds: any,
    ) {
        this.registry = registry;
        this.url = url;
        this.statusPageToken = statusPageToken;
        this.pageId = pageId;
        this.metricIds = metricIds;
    }

    public report() {
        const metrics = getNamedMetrics(this.registry);

        if (metrics.counters.length !== 0) {
            metrics.counters.forEach((count) => {
                this.reportCounter(count);
            });
        }

        if (metrics.meters.length !== 0) {
            metrics.meters.forEach((meter) => {
                this.reportMeter(meter);
            });
        }

        if (metrics.timers.length !== 0) {
            metrics.timers.forEach((timer) => {
                if (timer.min() != null) {
                    this.reportTimer(timer);
                }
            });
        }

        if (metrics.histograms.length !== 0) {
            metrics.histograms.forEach((histogram) => {
                if (histogram.min != null) {
                    this.reportHistogram(histogram);
                }
            });
        }
    }

    public reportMetric(name, value) {
        const metricId = this.metricIds[name];
        if (!metricId) {
            // only send the ones that are mapped in this.metricIds
            return;
        }

        const method = "POST";
        const host = this.url;
        const path = `/v1/pages/${this.pageId}/metrics/${metricId}/data.json`;
        const formData = { "data[timestamp]": moment().unix(), "data[value]": value };

        const headers = {
            Authorization: `OAuth ${this.statusPageToken}`,
        };

        request.post({url: `https://${host}${path}`, formData,  headers}, (err, resp, body) => {
            if (err) {
                console.error("couldnt post to statuspage.io:", util.inspect(err));
            }
        });
    };

    private reportCounter(counter) {
        this.reportMetric(counter.name, counter.count);
    };

    private reportMeter(meter) {
        this.reportMetric(`${meter.name}.count`, meter.count);
        this.reportMetric(`${meter.name}.mean_rate`, toOpsPerMin(meter.meanRate()));
        this.reportMetric(`${meter.name}.m1_rate`, toOpsPerMin(meter.oneMinuteRate()));
        this.reportMetric(`${meter.name}.m5_rate`, toOpsPerMin(meter.fiveMinuteRate()));
        this.reportMetric(`${meter.name}.m15_rate`, toOpsPerMin(meter.fifteenMinuteRate()));
    };

    private reportTimer(timer) {
        this.reportMetric(`${timer.name}.count`, timer.count());
        this.reportMetric(`${timer.name}.mean_rate`, timer.meanRate());
        this.reportMetric(`${timer.name}.m1_rate`, timer.oneMinuteRate());
        this.reportMetric(`${timer.name}.m5_rate`, timer.fiveMinuteRate());
        this.reportMetric(`${timer.name}.m15_rate`, timer.fifteenMinuteRate());

        const percentiles = timer.percentiles([.50, .75, .95, .98, .99, .999]);
        this.reportMetric(`${timer.name}.mean`, toMs(timer.min()));
        this.reportMetric(`${timer.name}.mean`, toMs(timer.mean()));
        this.reportMetric(`${timer.name}.max`, toMs(timer.max()));
        this.reportMetric(`${timer.name}.stddev`, toMs(timer.stdDev()));
        this.reportMetric(`${timer.name}.p50`, toMs(percentiles[.50]));
        this.reportMetric(`${timer.name}.p75`, toMs(percentiles[.75]));
        this.reportMetric(`${timer.name}.p95`, toMs(percentiles[.95]));
        this.reportMetric(`${timer.name}.p98`, toMs(percentiles[.98]));
        this.reportMetric(`${timer.name}.p99`, toMs(percentiles[.99]));
        this.reportMetric(`${timer.name}.p999`, toMs(percentiles[.999]));
    };

    private reportHistogram(histogram) {
        this.reportMetric(`${histogram.name}.count`, histogram.count);
        const percentiles = histogram.percentiles([.50, .75, .95, .98, .99, .999]);
        this.reportMetric(`${histogram.name}.mean`, histogram.min);
        this.reportMetric(`${histogram.name}.mean`, histogram.mean());
        this.reportMetric(`${histogram.name}.max`, histogram.max );
        this.reportMetric(`${histogram.name}.stddev`, histogram.stdDev());
        this.reportMetric(`${histogram.name}.p50`, percentiles[.50]);
        this.reportMetric(`${histogram.name}.p75`, percentiles[.75]);
        this.reportMetric(`${histogram.name}.p95`, percentiles[.95]);
        this.reportMetric(`${histogram.name}.p98`, percentiles[.98]);
        this.reportMetric(`${histogram.name}.p99`, percentiles[.99]);
        this.reportMetric(`${histogram.name}.p999`, percentiles[.999]);
    };

}
