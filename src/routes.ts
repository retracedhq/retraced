// core
import createAdminSession from "./handlers/createAdminSession";
import createViewerSession from "./handlers/createViewerSession";
import getInvite from "./handlers/getInvite";
import graphQL from "./handlers/graphql";

// admin
import adminGraphQL from "./handlers/admin/graphql";
import cancelEmailReport from "./handlers/admin/cancelEmailReport";
import createEnvironment from "./handlers/admin/createEnvironment";
import createInvite from "./handlers/admin/createInvite";
import createProject from "./handlers/admin/createProject";
import deleteTeamMember from "./handlers/admin/deleteTeamMember";
import listTeamMembers from "./handlers/admin/listTeamMembers";
import deleteInvite from "./handlers/admin/deleteInvite";
import searchEvents from "./handlers/admin/searchEvents";
import getAction from "./handlers/admin/getAction";
import getActor from "./handlers/admin/getActor";
import getDashboard from "./handlers/admin/getDashboard";
import getProject from "./handlers/admin/getProject";
import listActions from "./handlers/admin/listActions";
import listActors from "./handlers/admin/listActors";
import listInvites from "./handlers/admin/listInvites";
import listProjects from "./handlers/admin/listProjects";
import listTargets from "./handlers/admin/listTargets";
import updateUser from "./handlers/admin/updateUser";
import searchGroups from "./handlers/admin/searchGroups";

// enterprise
// import enterpriseCreateActiveSearch from "./handlers/enterprise/createActiveSearch";
// import enterpriseCreateSavedSearch from "./handlers/enterprise/createSavedSearch";
import enterpriseDeleteActiveSearch from "./handlers/enterprise/deleteActiveSearch";
import enterpriseGraphQL from "./handlers/enterprise/graphql";
import enterprisePumpActiveSearch from "./handlers/enterprise/pumpActiveSearch";
import enterpriseSearchAdHoc from "./handlers/enterprise/searchAdHoc";

// viewer
import viewerCreateEitapiToken from "./handlers/viewer/createEitapiToken";
import viewerCreateExport from "./handlers/viewer/createExport";
import viewerSearchEvents from "./handlers/viewer/searchEvents";
import viewerDeleteEitapiToken from "./handlers/viewer/deleteEitapiToken";
import viewerGraphQL from "./handlers/viewer/graphql";
import viewerListEitapiTokens from "./handlers/viewer/listEitapiTokens";
import viewerListExports from "./handlers/viewer/listExports";
import viewerRenderSavedExport from "./handlers/viewer/renderSavedExport";
import viewerUpdateEitapiToken from "./handlers/viewer/updateEitapiToken";
import viewerUpdateExport from "./handlers/viewer/updateExport";

export default {
  publisherGraphQLGet: {
    path: "/publisher/v1/graphql",
    method: "get",
    handler: graphQL,
  },
  publisherGraphQLPost: {
    path: "/publisher/v1/graphql",
    method: "post",
    handler: graphQL,
  },

  //
  // admin
  //
  adminCreateAdminSession: {
    path: "/admin/v1/user/login",
    method: "post",
    handler: createAdminSession,
  },
  adminGetInvite: {
    path: "/admin/v1/invite",
    method: "get",
    handler: getInvite,
  },
  adminCancelEmailReport: {
    path: "/admin/v1/environment/:environmentId/user/:userId/unsubscribe/:report",
    method: "get",
    handler: cancelEmailReport,
  },
  adminCreateEnvironment: {
    path: "/admin/v1/project/:projectId/environment",
    method: "post",
    handler: createEnvironment,
  },
  adminCreateInvite: {
    path: "/admin/v1/project/:projectId/invite",
    method: "post",
    handler: createInvite,
  },
  adminCreateProject: {
    path: "/admin/v1/project",
    method: "post",
    handler: createProject,
  },
  adminDeleteTeamMember: {
    path: "/admin/v1/project/:projectId/team/member/:userId",
    method: "delete",
    handler: deleteTeamMember,
  },
  adminDeleteInvite: {
    path: "/admin/v1/project/:projectId/invite/:inviteId",
    method: "delete",
    handler: deleteInvite,
  },
  adminGetAction: {
    path: "/admin/v1/project/:projectId/action/:actionId",
    method: "get",
    handler: getAction,
  },
  adminGetActor: {
    path: "/admin/v1/project/:projectId/actor/:actorId",
    method: "get",
    handler: getActor,
  },
  adminGetDashboard: {
    path: "/admin/v1/project/:projectId/dashboard",
    method: "get",
    handler: getDashboard,
  },
  adminGetProject: {
    path: "/admin/v1/project/:projectId",
    method: "get",
    handler: getProject,
  },
  adminGraphQLGet: {
    path: "/admin/v1/project/:projectId/environment/:environmentId/graphql",
    method: "get",
    handler: adminGraphQL,
  },
  adminGraphQLPost: {
    path: "/admin/v1/project/:projectId/environment/:environmentId/graphql",
    method: "post",
    handler: adminGraphQL,
  },
  adminListActions: {
    path: "/admin/v1/project/:projectId/actions",
    method: "get",
    handler: listActions,
  },
  adminListActors: {
    path: "/admin/v1/project/:projectId/actors",
    method: "get",
    handler: listActors,
  },
  adminListTeamMembers: {
    path: "/admin/v1/project/:projectId/team",
    method: "get",
    handler: listTeamMembers,
  },
  adminListInvites: {
    path: "/admin/v1/project/:projectId/invites",
    method: "get",
    handler: listInvites,
  },
  adminListProjects: {
    path: "/admin/v1/projects",
    method: "get",
    handler: listProjects,
  },
  adminSearchGroups: {
    path: "/admin/v1/project/:projectId/groups",
    method: "get",
    handler: searchGroups,
  },
  adminListTargets: {
    path: "/admin/v1/project/:projectId/targets",
    method: "get",
    handler: listTargets,
  },
  adminSearchEvents: {
    path: "/admin/v1/project/:projectId/events/search",
    method: "post",
    handler: searchEvents,
  },
  adminUpdateUser: {
    path: "/admin/v1/user/:userId",
    method: "put",
    handler: updateUser,
  },

  //
  // viewer
  //
  viewerCreateViewerSession: {
    path: "/viewer/v1/viewersession",
    method: "post",
    handler: createViewerSession,
  },
  viewerCreateEitapiToken: {
    path: "/viewer/v1/project/:projectId/eitapi_token",
    method: "post",
    handler: viewerCreateEitapiToken,
  },
  viewerCreateExport: {
    path: "/viewer/v1/project/:projectId/export",
    method: "post",
    handler: viewerCreateExport,
  },
  viewerGraphQLGet: {
    path: "/viewer/v1/graphql",
    method: "get",
    handler: viewerGraphQL,
  },
  viewerGraphQLPost: {
    path: "/viewer/v1/graphql",
    method: "post",
    handler: viewerGraphQL,
  },
  viewerSearchEvents: {
    path: "/viewer/v1/project/:projectId/events/search",
    method: "post",
    handler: viewerSearchEvents,
  },
  viewerDeleteEitapiToken: {
    path: "/viewer/v1/project/:projectId/eitapi_token/:tokenId",
    method: "delete",
    handler: viewerDeleteEitapiToken,
  },
  viewerListEitapiTokens: {
    path: "/viewer/v1/project/:projectId/eitapi_tokens",
    method: "get",
    handler: viewerListEitapiTokens,
  },
  viewerListExports: {
    path: "/viewer/v1/project/:projectId/exports",
    method: "get",
    handler: viewerListExports,
  },
  viewerRenderSavedExport: {
    path: "/viewer/v1/project/:projectId/export/:exportId/rendered",
    method: "get",
    handler: viewerRenderSavedExport,
  },
  viewerUpdateEitapiToken: {
    path: "/viewer/v1/project/:projectId/eitapi_token/:tokenId",
    method: "put",
    handler: viewerUpdateEitapiToken,
  },
  viewerUpdateExport: {
    path: "/viewer/v1/project/:projectId/export/:exportId",
    method: "put",
    handler: viewerUpdateExport,
  },

  //
  // enterprise
  //
  // Commented routes have been moved to TSOA
  // enterpriseCreateActiveSearch: {
  //   path: "/enterprise/v1/search/active",
  //   method: "post",
  //   handler: enterpriseCreateActiveSearch,
  // },
  // enterpriseCreateSavedSearch: {
  //   path: "/enterprise/v1/search/saved",
  //   method: "post",
  //   handler: enterpriseCreateSavedSearch,
  // },
  // enterpriseGraphQLPost: {
  //   path: "/enterprise/v1/graphql",
  //   method: "post",
  //   handler: enterpriseGraphQL,
  // },
  enterpriseDeleteActiveSearch: {
    path: "/enterprise/v1/search/active/:activeSearchId",
    method: "delete",
    handler: enterpriseDeleteActiveSearch,
  },
  enterpriseGraphQLGet: {
    path: "/enterprise/v1/graphql",
    method: "get",
    handler: enterpriseGraphQL,
  },
  enterprisePumpActiveSearch: {
    path: "/enterprise/v1/search/active/:activeSearchId",
    method: "get",
    handler: enterprisePumpActiveSearch,
  },
  enterpriseSearchAdHoc: {
    path: "/enterprise/v1/search/adhoc",
    method: "get",
    handler: enterpriseSearchAdHoc,
  },
};

export function LegacyRoutes() {
  return exports.default;
}
