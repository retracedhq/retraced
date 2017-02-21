// core
import createAdminSession from "./handlers/createAdminSession";
import createEvent from "./handlers/createEvent";
import createViewerDescriptor from "./handlers/createViewerDescriptor";
import createViewerSession from "./handlers/createViewerSession";
import getInvite from "./handlers/getInvite";

// admin
import createApiToken from "./handlers/admin/createApiToken";
import createEnvironment from "./handlers/admin/createEnvironment";
import createInvite from "./handlers/admin/createInvite";
import createProject from "./handlers/admin/createProject";
import deepSearch from "./handlers/admin/deepSearch";
import getAction from "./handlers/admin/getAction";
import getActor from "./handlers/admin/getActor";
import getDashboard from "./handlers/admin/getDashboard";
import getEvent from "./handlers/admin/getEvent";
import getEventsBulk from "./handlers/admin/getEventsBulk";
import getProject from "./handlers/admin/getProject";
import listActions from "./handlers/admin/listActions";
import listActors from "./handlers/admin/listActors";
import listGroup from "./handlers/admin/listGroup";
import listProjects from "./handlers/admin/listProjects";
import listTargets from "./handlers/admin/listTargets";
import updateAction from "./handlers/admin/updateAction";

// enterprise
import enterpriseCreateActiveSearch from "./handlers/enterprise/createActiveSearch";
import enterpriseCreateSavedSearch from "./handlers/enterprise/createSavedSearch";
import enterpriseDeleteActiveSearch from "./handlers/enterprise/deleteActiveSearch";
import enterprisePumpActiveSearch from "./handlers/enterprise/pumpActiveSearch";
import enterpriseSearchAdHoc from "./handlers/enterprise/searchAdHoc";

// viewer
import viewerCreateEitapiToken from "./handlers/viewer/createEitapiToken";
import viewerCreateExport from "./handlers/viewer/createExport";
import viewerDeepSearch from "./handlers/viewer/deepSearch";
import viewerDeleteEitapiToken from "./handlers/viewer/deleteEitapiToken";
import viewerGetEventsBulk from "./handlers/viewer/getEventsBulk";
import viewerListEitapiTokens from "./handlers/viewer/listEitapiTokens";
import viewerListExports from "./handlers/viewer/listExports";
import viewerRenderSavedExport from "./handlers/viewer/renderSavedExport";
import viewerUpdateEitapiToken from "./handlers/viewer/updateEitapiToken";
import viewerUpdateExport from "./handlers/viewer/updateExport";

export default {
  //
  // core
  //
  createAdminSession: {
    path: "/v1/user/login",
    method: "post",
    handler: createAdminSession,
  },
  createEvent: {
    path: "/v1/project/:projectId/event",
    method: "post",
    handler: createEvent,
  },
  createViewerDescriptor: {
    path: "/v1/project/:projectId/viewertoken",
    method: "get",
    handler: createViewerDescriptor,
  },
  createViewerSession: {
    path: "/v1/viewersession",
    method: "post",
    handler: createViewerSession,
  },
  getInvite: {
    path: "/v1/invite",
    method: "get",
    handler: getInvite,
  },

  //
  // admin
  //
  createApiToken: {
    path: "/v1/project/:projectId/token",
    method: "post",
    handler: createApiToken,
  },
  createEnvironment: {
    path: "/v1/project/:projectId/environment",
    method: "post",
    handler: createEnvironment,
  },
  createInvite: {
    path: "/v1/project/:projectId/invite",
    method: "post",
    handler: createInvite,
  },
  createProject: {
    path: "/v1/project",
    method: "post",
    handler: createProject,
  },
  deepSearch: {
    path: "/v1/project/:projectId/events/search/deep",
    method: "post",
    handler: deepSearch,
  },
  getAction: {
    path: "/v1/project/:projectId/action/:actionId",
    method: "get",
    handler: getAction,
  },
  getActor: {
    path: "/v1/project/:projectId/actor/:actorId",
    method: "get",
    handler: getActor,
  },
  getDashboard: {
    path: "/v1/project/:projectId/dashboard",
    method: "get",
    handler: getDashboard,
  },
  getEvent: {
    path: "/v1/project/:projectId/event/:eventId",
    method: "get",
    handler: getEvent,
  },
  getEventsBulk: {
    path: "/v1/project/:projectId/events/bulk",
    method: "post",
    handler: getEventsBulk,
  },
  getProject: {
    path: "/v1/project/:projectId",
    method: "get",
    handler: getProject,
  },
  listActions: {
    path: "/v1/project/:projectId/actions",
    method: "get",
    handler: listActions,
  },
  listActors: {
    path: "/v1/project/:projectId/actors",
    method: "get",
    handler: listActors,
  },
  listGroup: {
    path: "/v1/project/:projectId/group",
    method: "get",
    handler: listGroup,
  },
  listProjects: {
    path: "/v1/projects",
    method: "get",
    handler: listProjects,
  },
  listTargets: {
    path: "/v1/project/:projectId/targets",
    method: "get",
    handler: listTargets,
  },
  updateAction: {
    path: "/v1/project/:projectId/action/:actionId",
    method: "put",
    handler: updateAction,
  },

  //
  // enterprise
  //
  enterpriseCreateActiveSearch: {
    path: "/v1/eit/search/active",
    method: "post",
    handler: enterpriseCreateActiveSearch,
  },
  enterpriseCreateSavedSearch: {
    path: "/v1/eit/search/saved",
    method: "post",
    handler: enterpriseCreateSavedSearch,
  },
  enterpriseDeleteActiveSearch: {
    path: "/v1/eit/search/active/:activeSearchId",
    method: "delete",
    handler: enterpriseDeleteActiveSearch,
  },
  enterprisePumpActiveSearch: {
    path: "/v1/eit/search/active/:activeSearchId",
    method: "get",
    handler: enterprisePumpActiveSearch,
  },
  enterpriseSearchAdHoc: {
    path: "/v1/eit/search/adhoc",
    method: "get",
    handler: enterpriseSearchAdHoc,
  },

  //
  /// viewer
  //
  viewerCreateEitapiToken: {
    path: "/v1/project/:projectId/eitapi_token",
    method: "post",
    handler: viewerCreateEitapiToken,
  },
  viewerCreateExport: {
    path: "/v1/project/:projectId/export",
    method: "post",
    handler: viewerCreateExport,
  },
  viewerDeepSearch: {
    path: "/v1/viewer/:projectId/events/search/deep",
    method: "post",
    handler: viewerDeepSearch,
  },
  viewerDeleteEitapiToken: {
    path: "/v1/project/:projectId/eitapi_token/:tokenId",
    method: "delete",
    handler: viewerDeleteEitapiToken,
  },
  viewerGetEventsBulk: {
    path: "/v1/viewer/:projectId/events/bulk",
    method: "post",
    handler: viewerGetEventsBulk,
  },
  viewerListEitapiTokens: {
    path: "/v1/project/:projectId/eitapi_tokens",
    method: "get",
    handler: viewerListEitapiTokens,
  },
  viewerListExports: {
    path: "/v1/project/:projectId/exports",
    method: "get",
    handler: viewerListExports,
  },
  viewerRenderSavedExport: {
    path: "/v1/project/:projectId/export/:exportId/rendered",
    method: "get",
    handler: viewerRenderSavedExport,
  },
  viewerUpdateEitapiToken: {
    path: "/v1/project/:projectId/eitapi_token/:tokenId",
    method: "put",
    handler: viewerUpdateEitapiToken,
  },
  viewerUpdateExport: {
    path: "/v1/project/:projectId/export/:exportId",
    method: "put",
    handler: viewerUpdateExport,
  },
};
