const routes = {
  userCreate: {
    path: "/v1/user/signup",
    method: "post",
  },
  userLogin: {
    path: "/v1/user/login",
    method: "post",
  },
  listProjects: {
    handler: "listProjects",
    path: "/v1/projects",
    method: "get",
  },
  createProject: {
    handler: "createProject",
    path: "/v1/project",
    method: "post",
  },
  getProject: {
    handler: "getProject",
    path: "/v1/project/:projectId",
    method: "get",
  },
  searchEvents: {
    handler: "searchEvents",
    path: "/v1/project/:projectId/events/search",
    method: "post",
  },
  deepSearch: {
    handler: "deepSearch",
    path: "/v1/project/:projectId/events/search/deep",
    method: "post",
  },
  getEventsBulk: {
    path: "/v1/project/:projectId/events/bulk",
    method: "post",
  },
  listTeam: {
    path: "/v1/project/:projectId/team",
    method: "get",
  },
  createEvent: {
    path: "/v1/project/:projectId/event",
    method: "post",
  },
  createEnvironment: {
    path: "/v1/project/:projectId/environment",
    method: "post",
  },
  createApiToken: {
    path: "/v1/project/:projectId/token",
    method: "post",
  },
  viewerSession: {
    path: "/v1/viewersession",
    method: "post",
  },
  viewerEvents: {
    path: "/v1/viewer/:projectId/events/search",
    method: "get",
  },
  viewerGetEventsBulk: {
    path: "/v1/viewer/:projectId/events/bulk",
    method: "post",
  },
  viewerDeepSearch: {
    path: "/v1/viewer/:projectId/events/search/deep",
    method: "post",
  },
  listObjects: {
    path: "/v1/project/:projectId/objects",
    method: "get",
  },
  listActors: {
    path: "/v1/project/:projectId/actors",
    method: "get",
  },
  createInvite: {
    path: "/v1/project/:projectId/invite",
    method: "post",
  },
  getInvite: {
    path: "/v1/invite",
    method: "get",
  },
  acceptInvite: {
    path: "/v1/invite/accept",
    method: "post",
  },
  getEvent: {
    path: "/v1/project/:projectId/event/:eventId",
    method: "get",
  },
  listAction: {
    path: "/v1/project/:projectId/actions",
    method: "get",
  },
  getActor: {
    path: "/v1/project/:projectId/actor/:actorId",
    method: "get",
  },
  getAction: {
    path: "/v1/project/:projectId}/action/:actionId}",
    method: "get",
  },
  updateAction: {
    path: "/v1/project/:projectId/action/:actionId",
    method: "put",
  },
  viewerToken: {
    path: "/v1/project/:projectId/viewertoken",
    method: "get",
  },
};

export default routes;
