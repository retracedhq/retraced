interface ViewerDescriptor {
  id: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  isAdmin: boolean;
  viewLogAction: string;
  created: number;
  scope: string;
}

export default ViewerDescriptor;
