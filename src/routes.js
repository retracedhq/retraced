import createApiToken from "./handlers/core/createApiToken";
import createEnvironment from "./handlers/core/createEnvironment";
import createEvent from "./handlers/core/createEvent";
import createInvite from "./handlers/core/createInvite";
import createProject from "./handlers/core/createProject";
import createToken from "./handlers/core/createToken";
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
import listObjects from "./handlers/core/listObjects";
import listProjects from "./handlers/core/listProjects";
import listTeam from "./handlers/core/listTeam";
import updateAction from "./handlers/core/updateAction";
import userLogin from "./handlers/core/userLogin";
import viewerCreateExport from "./handlers/core/viewer/createExport";
import viewerListExports from "./handlers/core/viewer/listExports";
import viewerRenderSavedExport from "./handlers/core/viewer/renderSavedExport";
import viewerUpdateExport from "./handlers/core/viewer/updateExport";
import viewerDeepSearch from "./handlers/core/viewer/deepSearch";
import viewerGetEventsBulk from "./handlers/core/viewer/getEventsBulk";
import viewerSession from "./handlers/core/viewer/viewerSession";
import viewerToken from "./handlers/core/viewer/viewerToken";

export default {
  userLogin: {
    path: "/v1/user/login",
    method: "post",
    handler: userLogin,
  },
  listProjects: {
    path: "/v1/projects",
    method: "get",
    handler: listProjects,
  },
  createProject: {
    path: "/v1/project",
    method: "post",
    handler: createProject,
  },
  getProject: {
    path: "/v1/project/:projectId",
    method: "get",
    handler: getProject,
  },
  deepSearch: {
    path: "/v1/project/:projectId/events/search/deep",
    method: "post",
    handler: deepSearch,
  },
  getEventsBulk: {
    path: "/v1/project/:projectId/events/bulk",
    method: "post",
    handler: getEventsBulk,
  },
  listTeam: {
    path: "/v1/project/:projectId/team",
    method: "get",
    handler: listTeam,
  },
  createEvent: {
    path: "/v1/project/:projectId/event",
    method: "post",
    handler: createEvent,
  },
  createEnvironment: {
    path: "/v1/project/:projectId/environment",
    method: "post",
    handler: createEnvironment,
  },
  createApiToken: {
    path: "/v1/project/:projectId/token",
    method: "post",
    handler: createApiToken,
  },
  viewerSession: {
    path: "/v1/viewersession",
    method: "post",
    handler: viewerSession,
  },
  viewerGetEventsBulk: {
    path: "/v1/viewer/:projectId/events/bulk",
    method: "post",
    handler: viewerGetEventsBulk,
  },
  viewerDeepSearch: {
    path: "/v1/viewer/:projectId/events/search/deep",
    method: "post",
    handler: viewerDeepSearch,
  },
  listTargets: {
    path: "/v1/project/:projectId/targets",
    method: "get",
    handler: listTargets,
  },
  listActors: {
    path: "/v1/project/:projectId/actors",
    method: "get",
    handler: listActors,
  },
  createInvite: {
    path: "/v1/project/:projectId/invite",
    method: "post",
    handler: createInvite,
  },
  getInvite: {
    path: "/v1/invite",
    method: "get",
    handler: getInvite,
  },
  getEvent: {
    path: "/v1/project/:projectId/event/:eventId",
    method: "get",
    handler: getEvent,
  },
  listActions: {
    path: "/v1/project/:projectId/actions",
    method: "get",
    handler: listActions,
  },
  getActor: {
    path: "/v1/project/:projectId/actor/:actorId",
    method: "get",
    handler: getActor,
  },
  getAction: {
    path: "/v1/project/:projectId/action/:actionId",
    method: "get",
    handler: getAction,
  },
  updateAction: {
    path: "/v1/project/:projectId/action/:actionId",
    method: "put",
    handler: updateAction,
  },
  getDashboard: {
    path: "/v1/project/:projectId/dashboard",
    method: "get",
    handler: getDashboard,
  },
  viewerToken: {
    path: "/v1/project/:projectId/viewertoken",
    method: "get",
    handler: viewerToken,
  },
  viewerCreateExport: {
    path: "/v1/project/:projectId/export",
    method: "post",
    handler: viewerCreateExport,
  },
  viewerListExports: {
    path: "/v1/project/:projectId/exports",
    method: "get",
    handler: viewerListExports,
  },
  viewerUpdateExport: {
    path: "/v1/project/:projectId/export/:exportId",
    method: "put",
    handler: viewerUpdateExport,
  },
  viewerRenderSavedExport: {
    path: "/v1/project/:projectId/export/:exportId/rendered",
    method: "get",
    handler: viewerRenderSavedExport,
  },
};
