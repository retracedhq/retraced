// TODO(zhaytee): Validation?

interface QueryDescriptor {
  version: 1;
  showCreate: boolean;
  showRead: boolean;
  showUpdate: boolean;
  showDelete: boolean;
  searchQuery?: string;
  startTime?: number;
  endTime?: number;
  actions?: string[];
  actorIds?: string[];
}

export default QueryDescriptor;
