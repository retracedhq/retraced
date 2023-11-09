import config from "../config";

const componentErrorsTotals = `subscription {
    componentErrorsTotals(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
        componentId
        metric {
            errorsTotal
        }
        __typename
    }
}`;

const componentReceivedEventsThroughput = `subscription {
    componentReceivedEventsThroughputs(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
        componentId
        throughput
        __typename
    }
}`;

const componentReceivedEventsTotals = `subscription {
    componentReceivedEventsTotals(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
        componentId
        metric {
            timestamp
            receivedEventsTotal
        }
        __typename
    }
}`;

const componentSentEventsThroughputs = `subscription {
    componentSentEventsThroughputs(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
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
    componentSentEventsTotals(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
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
    componentReceivedBytesTotals(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
		componentId
        metric {
            timestamp
            receivedBytesTotal
        }
        __typename
    }
}`;

const componentReceivedBytesThroughputs = `subscription {
    componentReceivedBytesThroughputs(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
		componentId
        throughput
        __typename
    }
}`;

const componentSentBytesTotals = `subscription {
    componentSentBytesTotals(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
		componentId
        metric {
            timestamp
            sentBytesTotal
        }
        __typename
    }
}`;

const componentSentBytesThroughputs = `subscription {
    componentSentBytesThroughputs(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
        componentId
        throughput
        __typename
    }
}`;

const errorsTotal = `subscription {
    errorsTotal(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
        timestamp
        errorsTotal
        __typename
    }
}`;

const allocatedBytes = `subscription {
    allocatedBytes(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
        timestamp
        allocatedBytes
        __typename
    }
}`;

const componentAllocatedBytes = `subscription {
    componentAllocatedBytes(interval: ${config.GRAPHQL_SUBSCRIPTION_INTERVAL}) {
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
  //   componentReceivedEventsThroughput,
  //   componentSentEventsThroughputs,
  componentReceivedEventsTotals,
  componentSentEventsTotals,
  errorsTotal,
  //   componentReceivedBytesThroughputs,
  //   componentSentBytesTotals,
  //   componentAllocatedBytes,
  componentErrorsTotals,
  //   componentSentBytesThroughputs,
  //   componentReceivedBytesTotals,
  //   componentRemoved,
  //   allocatedBytes,
  //   componentAdded,
  //   metrics,
};
