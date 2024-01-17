import { SplunkHecLogs } from "./splunk_hec_logs";

// Interface for a Sink
export interface Sink {
  // HealthCheck returns true if the sink is healthy
  healthCheck(): Promise<boolean>;
  // TransformEvent transforms an event before sending it to the sink
  transformEvent(event: any): any;
  // SendEvent sends an event to the sink
  sendEvent(event: any): Promise<boolean>;
  // SendEvents sends events to the sink
  sendEvents(events: any[]): Promise<void>;
}

export const getSinkInstance = (sinkConfig: any): Sink => {
  switch (sinkConfig.type) {
    case "splunk_hec_logs":
      return new SplunkHecLogs({
        defaultToken: sinkConfig.default_token,
        endpoint: sinkConfig.endpoint,
      });
    default:
      throw new Error(`unknown sink type: ${sinkConfig.type}`);
  }
};
