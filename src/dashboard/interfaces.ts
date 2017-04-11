
// DashboardOptions is a generic options parameter that
// all dashboard tiles should use.
export interface DashboardOptions {
  index: string;
  startTime: number;
  endTime: number;
}

export interface DashboardTile {
  row?: number;
  col?: number;
  title: string;
  type: string;
  data: any;
}
