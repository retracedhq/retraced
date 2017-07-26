import { DeletionRequestHydrated } from "../deletion_request";

export interface EnvironmentValues {
  name: string;
}

export interface Environment extends EnvironmentValues {
  projectId: string;
  id: string;
}

export interface EnvironmentResponse {
  id: string;
  project_id: string;
  name: string;
}

export interface EnvironmentHydrated extends Environment {
  deletionRequest?: DeletionRequestHydrated;
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

export function responseFromEnvironment(env: Environment): EnvironmentResponse {
  return {
    id: env.id,
    name: env.name,
    project_id: env.projectId,
  };
}
