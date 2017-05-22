interface ViewerDescriptor {
  id: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  isAdmin: boolean;
  created: number;
  scope: string;
  viewLogAction: string;
  actorId: string;
  ip?: string;
}

export default ViewerDescriptor;
