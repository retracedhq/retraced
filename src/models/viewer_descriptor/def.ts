interface ViewerDescriptor {
  id: string;
  projectId: string;
  environmentId: string;
  groupId: string;
  isAdmin: boolean;
  created: number;
  scope: string;
}

export default ViewerDescriptor;
