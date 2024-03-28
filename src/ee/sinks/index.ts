import { Sink } from "./interfaces";
import { SplunkHecLogs } from "./splunk_hec_logs";

export const getSinkInstance = (sinkConfig: any): Sink => {
  switch (sinkConfig.type) {
    case "splunk_hec_logs":
      return new SplunkHecLogs({
        defaultToken: sinkConfig.default_token,
        endpoint: sinkConfig.endpoint,
        indexingAckEnabled: sinkConfig?.acknowledgements?.indexer_acknowledgements_enabled,
      });
    default:
      throw new Error(`unknown sink type: ${sinkConfig.type}`);
  }
};
