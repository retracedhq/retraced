import axios from "axios";
import { ConfigManager } from "../services/configManager";
import graphql from "../services/graphql";
import { sleep } from "../services/helper";
import queries from "./queries";
import config from "../../../config";
import { logger } from "../../../logger";
const subscriptions = {};

type ComponentErrorsTotals = {
  componentId?: string;
  metric?: {
    timestamp?: Date;
    errorsTotal?: number;
  };
};

type ComponentReceivedEventsThroughput = {
  componentId?: string;
  throughput?: number;
};

type ComponentReceivedEventsTotal = {
  componentId?: string;
  metric?: ReceivedEventsTotal;
};

type ReceivedEventsTotal = {
  timestamp: Date;
  receivedEventsTotal?: number;
};

type ComponentSentEventsThroughput = {
  componentId?: string;
  throughput?: number;
  outputs?: OutputThroughput[];
};

type OutputThroughput = {
  outputId?: string;
  throughput?: number;
};

type ComponentReceivedBytesThroughput = {
  componentId?: string;
  throughput?: number;
};

type ComponentSentBytesThroughput = {
  componentId?: string;
  throughput?: number;
};

type ComponentReceivedBytesTotal = {
  componentId?: string;
  metric?: ReceivedBytesTotal;
};

type ReceivedBytesTotal = {
  timestamp: Date;
  receivedBytesTotal: number;
};

type ComponentSentEventsTotal = {
  componentId?: string;
  metric?: SentEventsTotal;
  outputs?: Output[];
};

type SentEventsTotal = {
  timestamp: Date;
  sentEventsTotal?: number;
};

type Output = {
  outputId?: string;
  sentEventsTotal: SentEventsTotal;
};

type ComponentSentBytesTotal = {
  componentId?: string;
  metric?: SentBytesTotal;
};

type SentBytesTotal = {
  timestamp: Date;
  sentBytesTotal?: number;
};

type AllocatedBytes = {
  timestamp: Date;
  allocatedBytes?: number;
};

type ComponentAllocatedBytes = {
  componentId?: string;
  metric?: AllocatedBytes;
};

type Component = {
  componentId?: string;
  componentType?: string;
};

type MetricType = {
  timestamp: Date;
};

const handleEvent = (event: any, name: string) => {
  let data;
  const instance = ConfigManager.getInstance();
  switch (name) {
    case "componentErrorsTotals":
      data = event.data.componentErrorsTotals as ComponentErrorsTotals[];
      if (data.length > 0) {
        logger.info(
          data.map((d: ComponentErrorsTotals) => `${d.componentId}: ${d?.metric?.errorsTotal}`).join("\n")
        );
      }
      break;
    case "componentReceivedEventsThroughput":
      data = event.data.componentReceivedEventsThroughputs as ComponentReceivedEventsThroughput[];
      if (data.length > 0) {
        logger.info({ data });
      }
      break;
    case "componentReceivedEventsTotals":
      data = event.data.componentReceivedEventsTotals as ComponentReceivedEventsTotal[];
      if (data.length > 0) {
        logger.info(name);
        for (const d of data) {
          if (d?.metric?.receivedEventsTotal) {
            if (!isNaN(d?.metric?.receivedEventsTotal)) {
              if (d?.metric?.receivedEventsTotal > 0) {
                logger.info(`${d.componentId}: ${d?.metric?.receivedEventsTotal}`);
                instance.updateReceivedEventsStats(d.componentId, d?.metric?.receivedEventsTotal || 0);
              }
            }
          }
        }
      }
      break;
    case "componentSentEventsThroughputs":
      data = event.data.componentSentEventsThroughputs as ComponentSentEventsThroughput[];
      if (data.length > 0) {
        logger.info(
          data.map((d: ComponentSentEventsThroughput) => {
            return {
              componentId: d.componentId,
              throughput: d.throughput,
              outputs: JSON.stringify(d.outputs),
            };
          })
        );
      }
      break;
    case "componentReceivedBytesThroughputs":
      data = event.data.componentReceivedBytesThroughputs as ComponentReceivedBytesThroughput[];
      if (data.length > 0) {
        logger.info({ data });
      }
      break;
    case "componentSentBytesThroughputs":
      data = event.data.componentSentBytesThroughputs as ComponentSentBytesThroughput[];
      if (data.length > 0) {
        logger.info({ data });
      }
      break;
    case "componentReceivedBytesTotals":
      data = event.data.componentReceivedBytesTotals as ComponentReceivedBytesTotal[];
      if (data.length > 0) {
        logger.info({
          data: data.map((d) => {
            return {
              componentId: d.componentId,
              receivedBytesTotal: d?.metric?.receivedBytesTotal || 0,
            };
          }),
        });
      }
      break;
    case "componentSentEventsTotals":
      data = event.data.componentSentEventsTotals as ComponentSentEventsTotal[];
      if (data.length > 0) {
        logger.info(name);
        for (const d of data) {
          if (d?.metric?.sentEventsTotal) {
            if (!isNaN(d?.metric?.sentEventsTotal)) {
              if (d?.metric?.sentEventsTotal > 0) {
                logger.info(`${d.componentId}: ${d?.metric?.sentEventsTotal}`);
                instance.updateSentEventsStats(d.componentId, d?.metric?.sentEventsTotal);
              }
            }
          }
        }
      }
      break;
    case "componentSentBytesTotals":
      data = event.data.componentSentBytesTotals as ComponentSentBytesTotal[];
      if (data.length > 0) {
        logger.info(
          data
            .map((d: ComponentSentBytesTotal) => `${d.componentId}: ${d?.metric?.sentBytesTotal}`)
            .join("\n")
        );
      }
      break;
    case "componentAllocatedBytes":
      data = event.data.componentAllocatedBytes as ComponentAllocatedBytes[];
      if (data.length > 0) {
        logger.info(
          data
            .map((d: ComponentAllocatedBytes) => `${d.componentId}: ${d?.metric?.allocatedBytes}`)
            .join("\n")
        );
      }
      break;
    case "componentRemoved":
      logger.info(data);
      data = event.data.componentRemoved as Component;
      if (data) {
        logger.info(`componentId: ${data.componentId}, componentType: ${data.componentType}`);
      }
      break;
    case "allocatedBytes":
      data = event.data.allocatedBytes as AllocatedBytes;
      if (data) {
        logger.info(`timestamp: ${data.timestamp}, allocatedBytes: ${data.allocatedBytes}`);
      }
      break;
    case "componentAdded":
      logger.info(data);
      data = event.data.componentRemoved as Component;
      if (data) {
        logger.info(`componentId: ${data.componentId}, componentType: ${data.componentType}`);
      }
      break;
    case "metrics":
      data = event.data.metrics as MetricType;
      if (data) {
        logger.info(`timestamp: ${data.timestamp}`);
      }
      break;
    default:
      logger.info(event);
      logger.info({ data: event.data[name] });
  }
};

const attachListensers = async (sub: any, name: string) => {
  for await (const event of sub) {
    handleEvent(event, name);
  }
};

export const getHealth = (port) => {
  return new Promise((resolve) => {
    const url = `${config.VECTOR_HOST_PROTOCOL}://${config.VECTOR_HOST}:${port}/health`;

    axios
      .get(url)
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
};

const init = async () => {
  do {
    const health = await getHealth(config.VECTOR_API_PORT);
    if (health) {
      break;
    }
    await sleep(1000);
  } while (true);
  for (const queryName in queries) {
    if (!subscriptions[queryName]) {
      subscriptions[queryName] = graphql.graphQLWSClient.iterate({
        query: queries[queryName],
      });
      do {
        try {
          await attachListensers(subscriptions[queryName], queryName);
          logger.info(`[attachListensers] ${queryName} attached`);
          break;
        } catch (ex) {
          logger.info("[attachListensers]", ex);
          logger.info(`[attachListensers] Retrying...`);
          sleep(1000);
        }
      } while (true);
    }
  }
};

export default {
  init,
  subscriptions,
};
