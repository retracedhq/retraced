export const getSafeFileName = (tenant: string, name: string): string => {
  var s = `${tenant}_${name}`;
  var filename = s.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return filename;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
          type: "disk",
          max_size: 268435488,
          when_full: "block",
        },
        batch: {
          max_bytes: 1000000,
          max_events: 100,
        },
        inputs: [sourceName],
      },
    },
  };
  return finalConfig;
}
