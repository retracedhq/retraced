// core
import createApiToken from "./handlers/core/createApiToken";
import createEnvironment from "./handlers/core/createEnvironment";
import createEvent from "./handlers/core/createEvent";
import createInvite from "./handlers/core/createInvite";
import createProject from "./handlers/core/createProject";
import deepSearch from "./handlers/core/deepSearch";
import getAction from "./handlers/core/getAction";
import getActor from "./handlers/core/getActor";
import getDashboard from "./handlers/core/getDashboard";
import getEvent from "./handlers/core/getEvent";
import getEventsBulk from "./handlers/core/getEventsBulk";
import getInvite from "./handlers/core/getInvite";
import getProject from "./handlers/core/getProject";
import listActions from "./handlers/core/listActions";
import listActors from "./handlers/core/listActors";
import listTargets from "./handlers/core/listTargets";
import listProjects from "./handlers/core/listProjects";
import listTeam from "./handlers/core/listTeam";
import updateAction from "./handlers/core/updateAction";
import userLogin from "./handlers/core/userLogin";

// core/viewer
import viewerCreateEitapiToken from "./handlers/core/viewer/createEitapiToken";
import viewerCreateExport from "./handlers/core/viewer/createExport";
import viewerDeepSearch from "./handlers/core/viewer/deepSearch";
import viewerDeleteEitapiToken from "./handlers/core/viewer/deleteEitapiToken";
import viewerGetEventsBulk from "./handlers/core/viewer/getEventsBulk";
import viewerListEitapiTokens from "./handlers/core/viewer/listEitapiTokens";
import viewerListExports from "./handlers/core/viewer/listExports";
import viewerRenderSavedExport from "./handlers/core/viewer/renderSavedExport";
import viewerSession from "./handlers/core/viewer/viewerSession";
import viewerToken from "./handlers/core/viewer/viewerToken";
import viewerUpdateEitapiToken from "./handlers/core/viewer/updateEitapiToken";
import viewerUpdateExport from "./handlers/core/viewer/updateExport";

// enterprise
import enterpriseSearchAdHoc from "./handlers/enterprise/searchAdHoc";
import enterpriseCreateSavedSearch from "./handlers/enterprise/createSavedSearch";
import enterpriseCreateActiveSearch from "./handlers/enterprise/createActiveSearch";
import enterprisePumpActiveSearch from "./handlers/enterprise/pumpActiveSearch";
import enterpriseDeleteActiveSearch from "./handlers/enterprise/deleteActiveSearch";

export default {
  //
  // core
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
  createEvent: {
    path: "/v1/project/:projectId/event",
    method: "post",
    handler: createEvent,
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
  getInvite: {
    path: "/v1/invite",
    method: "get",
    handler: getInvite,
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
 listTargets: {
    path: "/v1/project/:projectId/targets",
    method: "get",
    handler: listTargets,
  },
  listProjects: {
    path: "/v1/projects",
    method: "get",
    handler: listProjects,
  },
  listTeam: {
    path: "/v1/project/:projectId/team",
    method: "get",
    handler: listTeam,
  },
  updateAction: {
    path: "/v1/project/:projectId/action/:actionId",
    method: "put",
    handler: updateAction,
  },
  userLogin: {
    path: "/v1/user/login",
    method: "post",
    handler: userLogin,
  },

  //
  // core/viewer
  //
  viewerCreateExport: {
    path: "/v1/project/:projectId/export",
    method: "post",
    handler: viewerCreateExport,
  },
  viewerCreateEitapiToken: {
    path: "/v1/project/:projectId/eitapi_token",
    method: "post",
    handler: viewerCreateEitapiToken,
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
  viewerSession: {
    path: "/v1/viewersession",
    method: "post",
    handler: viewerSession,
  },
  viewerToken: {
    path: "/v1/project/:projectId/viewertoken",
    method: "get",
    handler: viewerToken,
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

  //
  // enterprise
  //
  enterpriseSearchAdHoc: {
    path: "/v1/eit/search/adhoc",
    method: "get",
    handler: enterpriseSearchAdHoc,
  },
  enterpriseCreateSavedSearch: {
    path: "/v1/eit/search/saved",
    method: "post",
    handler: enterpriseCreateSavedSearch,
  },
  enterpriseCreateActiveSearch: {
    path: "/v1/eit/search/active",
    method: "post",
    handler: enterpriseCreateActiveSearch,
  },
  enterprisePumpActiveSearch: {
    path: "/v1/eit/search/active/:activeSearchId",
    method: "get",
    handler: enterprisePumpActiveSearch,
  },
  enterpriseDeleteActiveSearch: {
    path: "/v1/eit/search/active/:activeSearchId",
    method: "delete",
    handler: enterpriseDeleteActiveSearch,
  },
};
