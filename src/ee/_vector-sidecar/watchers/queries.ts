import config from "../config";

const componentErrorsTotals = `subscription {
    componentErrorsTotals(interval: ${config.graphQLSubscriptionInterval}) {
        componentId
        metric {
            errorsTotal
        }
        __typename
    }
}`;

const componentReceivedEventsThroughput = `subscription {
    componentReceivedEventsThroughputs(interval: ${config.graphQLSubscriptionInterval}) {
        componentId
        throughput
        __typename
    }
}`;

const componentReceivedEventsTotals = `subscription {
    componentReceivedEventsTotals(interval: ${config.graphQLSubscriptionInterval}) {
        componentId
        metric {
            timestamp
            receivedEventsTotal
        }
        __typename
    }
}`;

const componentSentEventsThroughputs = `subscription {
    componentSentEventsThroughputs(interval: ${config.graphQLSubscriptionInterval}) {
		componentId
		throughput
        outputs {
            outputId
            throughput
        }
        __typename
    }
}`;

const componentSentEventsTotals = `subscription {
    componentSentEventsTotals(interval: ${config.graphQLSubscriptionInterval}) {
		componentId
        outputs {
        outputId
            sentEventsTotal {
                timestamp
                sentEventsTotal
            }
        }
        metric {
            timestamp
            sentEventsTotal
        }
        __typename
    }
}`;

const componentReceivedBytesTotals = `subscription {
    componentReceivedBytesTotals(interval: ${config.graphQLSubscriptionInterval}) {
		componentId
        metric {
            timestamp
            receivedBytesTotal
        }
        __typename
    }
}`;

const componentReceivedBytesThroughputs = `subscription {
    componentReceivedBytesThroughputs(interval: ${config.graphQLSubscriptionInterval}) {
		componentId
        throughput
        __typename
    }
}`;

const componentSentBytesTotals = `subscription {
    componentSentBytesTotals(interval: ${config.graphQLSubscriptionInterval}) {
		componentId
        metric {
            timestamp
            sentBytesTotal
        }
        __typename
    }
}`;

const componentSentBytesThroughputs = `subscription {
    componentSentBytesThroughputs(interval: ${config.graphQLSubscriptionInterval}) {
        componentId
        throughput
        __typename
    }
}`;

const errorsTotal = `subscription {
    errorsTotal(interval: ${config.graphQLSubscriptionInterval}) {
        timestamp
        errorsTotal
        __typename
    }
}`;

const allocatedBytes = `subscription {
    allocatedBytes(interval: ${config.graphQLSubscriptionInterval}) {
        timestamp
        allocatedBytes
        __typename
    }
}`;

const componentAllocatedBytes = `subscription {
    componentAllocatedBytes(interval: ${config.graphQLSubscriptionInterval}) {
        componentId
        metric {
            timestamp
            allocatedBytes
        }
        __typename
    }
}`;

const metrics = `subscription {
    metrics {
      timestamp
      __typename
    }
}`;

const componentAdded = `subscription {
    componentReceivedEventsTotals(interval: 1000) {
        componentId
        metric {
            timestamp
            receivedEventsTotal
        }
    }
}`;

const componentRemoved = `subscription {
    componentRemoved {
        componentId
        componentType
        __typename
    }
}`;

export default {
  componentReceivedEventsThroughput,
  componentReceivedBytesThroughputs,
  componentSentEventsThroughputs,
  componentReceivedEventsTotals,
  componentSentBytesThroughputs,
  componentReceivedBytesTotals,
  componentSentEventsTotals,
  componentSentBytesTotals,
  componentAllocatedBytes,
  componentErrorsTotals,
  componentRemoved,
  allocatedBytes,
  componentAdded,
  errorsTotal,
  metrics,
};
