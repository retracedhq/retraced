export type Component = {
  componentId: string;
  componentType: string;
};

export enum componentKind {
  SOURCE = 'SOURCE',
  SINK = 'SINK',
  TRANSFORM = 'TRANSFORM',
}
