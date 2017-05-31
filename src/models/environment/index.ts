export interface EnvironmentValues {
  name: string;
  projectId: string;
}

export interface Environment extends EnvironmentValues {
  id: string;
}

export function environmentFromRow(row: any): Environment {
  return {
    id: row.id,
    name: row.name,
    projectId: row.project_id,
  };
}

export function rowFromEnvironment(env: Environment): any {
  return {
    id: env.id,
    name: env.name,
    project_id: env.projectId,
  };
}
