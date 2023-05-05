import * as uuid from "uuid";

export const createWorkflowId = () => {
  return uuid.v4();
};
