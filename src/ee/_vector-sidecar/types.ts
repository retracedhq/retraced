export type Component = {
  componentId: string;
  componentType: string;
};

export enum componentKind {
  SOURCE = 'SOURCE',
  SINK = 'SINK',
  TRANSFORM = 'TRANSFORM',
}

export type VectorConfig = {
  data_dir: string;
  api: {
    address: string;
    enabled: boolean;
    playground?: boolean;
  };
  sources: {
    [key: string]: any;
  };
  sinks: {
    [key: string]: any;
  };
};
