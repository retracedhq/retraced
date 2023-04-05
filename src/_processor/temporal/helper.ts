import * as uuid from "uuid";

export const createWorkflowId = (projectId: string, environmentId: string) => {
  return `${projectId}-${environmentId}-${uuid.v4()}`;
};
