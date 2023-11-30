import config from "../../../config";

export const getSafeFileName = (tenant: string, name: string): string => {
  const s = `${tenant}_${name}`;
  const filename = s.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return filename;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getVectorConfigPath = (id: string): string => {
  return `${config.VECTOR_DEFAULT_CONFIG_PATH}/${id}.json`;
};

export function getVectorConfig(sourceName: string, port: any, sinkName: string, sink: any) {
  const source = {
    [sourceName]: {
      type: "http_server",
      address: `0.0.0.0:${port}`,
      healthcheck: true,
    },
  };
  const finalConfig = {
    sources: source,
    sinks: {
      [sinkName]: {
        ...sink,
        buffer: {
          type: "memory",
          max_events: 10000,
        },
        // buffer: {
        //   type: "disk",
        //   max_size: 268435488,
        //   when_full: "block",
        // },
        batch: {
          max_bytes: 100000,
          max_events: 10,
        },
        inputs: [sourceName],
      },
    },
  };
  if (sink.type === "splunk_hec_logs") {
    const transformName = `transform_${sourceName}_to_${sinkName}`;
    const transform = {
      [transformName]: {
        type: "remap",
        inputs: [sourceName],
        source: `.event = parse_json!(parse_json!(.message).message)
        .time = .event.created
        .host = "boxyhq"
        .source = "boxyhq"
        del(.source_type)
        del(.message)`,
      },
    };
    finalConfig["transforms"] = transform;
    finalConfig.sinks[sinkName].inputs = [transformName];
  }
  return finalConfig;
}
