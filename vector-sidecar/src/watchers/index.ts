import graphql from '../services/graphql';
import queries from './queries';
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
  outputId?: String;
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
  outputId?: String;
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
  componentId?: String;
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
  switch (name) {
    case 'componentErrorsTotals':
      data = event.data.componentErrorsTotals as ComponentErrorsTotals[];
      if (data.length > 0) {
        console.log(
          data.map((d: ComponentErrorsTotals) => `${d.componentId}: ${d?.metric?.errorsTotal}`).join('\n')
        );
      }
      break;
    case 'componentReceivedEventsThroughput':
      data = event.data.componentReceivedEventsThroughputs as ComponentReceivedEventsThroughput[];
      if (data.length > 0) {
        console.table(data);
      }
      break;
    case 'componentReceivedEventsTotals':
      data = event.data.componentReceivedEventsTotals as ComponentReceivedEventsTotal[];
      if (data.length > 0) {
        console.log(
          data
            .map((d: ComponentReceivedEventsTotal) => `${d.componentId}: ${d?.metric?.receivedEventsTotal}`)
            .join('\n')
        );
      }
      break;
    case 'componentSentEventsThroughputs':
      data = event.data.componentSentEventsThroughputs as ComponentSentEventsThroughput[];
      if (data.length > 0) {
        console.log(
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
    case 'componentReceivedBytesThroughputs':
      data = event.data.componentReceivedBytesThroughputs as ComponentReceivedBytesThroughput[];
      if (data.length > 0) {
        console.table(data);
      }
      break;
    case 'componentSentBytesThroughputs':
      data = event.data.componentSentBytesThroughputs as ComponentSentBytesThroughput[];
      if (data.length > 0) {
        console.table(data);
      }
      break;
    case 'componentReceivedBytesTotals':
      data = event.data.componentReceivedBytesTotals as ComponentReceivedBytesTotal[];
      if (data.length > 0) {
        console.table(
          data.map((d) => {
            return {
              componentId: d.componentId,
              receivedBytesTotal: d?.metric?.receivedBytesTotal || 0,
            };
          })
        );
      }
      break;
    case 'componentSentEventsTotals':
      data = event.data.componentSentEventsTotals as ComponentSentEventsTotal[];
      if (data.length > 0) {
        console.log(
          data
            .map((d: ComponentSentEventsTotal) => `${d.componentId}: ${d?.metric?.sentEventsTotal}`)
            .join('\n')
        );
      }
      break;
    case 'componentSentBytesTotals':
      data = event.data.componentSentBytesTotals as ComponentSentBytesTotal[];
      if (data.length > 0) {
        console.log(
          data
            .map((d: ComponentSentBytesTotal) => `${d.componentId}: ${d?.metric?.sentBytesTotal}`)
            .join('\n')
        );
      }
      break;
    case 'componentAllocatedBytes':
      data = event.data.componentAllocatedBytes as ComponentAllocatedBytes[];
      if (data.length > 0) {
        console.log(
          data
            .map((d: ComponentAllocatedBytes) => `${d.componentId}: ${d?.metric?.allocatedBytes}`)
            .join('\n')
        );
      }
      break;
    case 'componentRemoved':
      console.log(data);
      data = event.data.componentRemoved as Component;
      if (data) {
        console.log(`componentId: ${data.componentId}, componentType: ${data.componentType}`);
      }
      break;
    case 'allocatedBytes':
      data = event.data.allocatedBytes as AllocatedBytes;
      if (data) {
        console.log(`timestamp: ${data.timestamp}, allocatedBytes: ${data.allocatedBytes}`);
      }
      break;
    case 'componentAdded':
      console.log(data);
      data = event.data.componentRemoved as Component;
      if (data) {
        console.log(`componentId: ${data.componentId}, componentType: ${data.componentType}`);
      }
      break;
    case 'metrics':
      data = event.data.metrics as MetricType;
      if (data) {
        console.log(`timestamp: ${data.timestamp}`);
      }
      break;
    default:
      console.log(event);
      console.table(event.data[name]);
  }
};

const attachListensers = async (sub: any, name: string) => {
  for await (const event of sub) {
    handleEvent(event, name);
  }
};

const init = async () => {
  for (const queryName in queries) {
    subscriptions[queryName] = graphql.graphQLWSClient.iterate({
      query: queries[queryName],
    });
    attachListensers(subscriptions[queryName], queryName);
  }
};

export default {
  init,
  subscriptions,
};
