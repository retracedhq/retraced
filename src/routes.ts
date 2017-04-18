// core
import createAdminSession from "./handlers/createAdminSession";
import createEvent from "./handlers/createEvent";
import createViewerDescriptor from "./handlers/createViewerDescriptor";
import createViewerSession from "./handlers/createViewerSession";
import getInvite from "./handlers/getInvite";
import graphQL from "./handlers/graphql";

// admin
import adminGraphQL from "./handlers/admin/graphql";
import cancelEmailReport from "./handlers/admin/cancelEmailReport";
import createApiToken from "./handlers/admin/createApiToken";
import createEnvironment from "./handlers/admin/createEnvironment";
import createInvite from "./handlers/admin/createInvite";
import createProject from "./handlers/admin/createProject";
import deleteApiToken from "./handlers/admin/deleteApiToken";
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
import searchTemplates from "./handlers/admin/searchTemplates";
import createTemplate from "./handlers/admin/createTemplate";
import publicRenderEvent from "./handlers/admin/publicRenderEvent";

// enterprise
import enterpriseCreateActiveSearch from "./handlers/enterprise/createActiveSearch";
import enterpriseCreateSavedSearch from "./handlers/enterprise/createSavedSearch";
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

  pulisherCreateViewerDescriptor: {
    path: "/publisher/v1/project/:projectId/viewertoken",
    method: "get",
    handler: createViewerDescriptor,
  },
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
  adminCreateApiToken: {
    path: "/admin/v1/project/:projectId/token",
    method: "post",
    handler: createApiToken,
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
  adminDeleteApiToken: {
    path: "/admin/v1/project/:projectId/token/:tokenId",
    method: "delete",
    handler: deleteApiToken,
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
  enterpriseCreateActiveSearch: {
    path: "/enterprise/v1/search/active",
    method: "post",
    handler: enterpriseCreateActiveSearch,
  },
  enterpriseCreateSavedSearch: {
    path: "/enterprise/v1/search/saved",
    method: "post",
    handler: enterpriseCreateSavedSearch,
  },
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
  enterpriseGraphQLPost: {
    path: "/enterprise/v1/graphql",
    method: "post",
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

//
  //
    // OLD ROUTES -- DONT DOCUMENT, DEPRECATE SOON
      //
        //
          //

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
  graphQLGet: {
    path: "/v1/graphql",
    method: "get",
    handler: graphQL,
  },
  graphQLPost: {
    path: "/v1/graphql",
    method: "post",
    handler: graphQL,
  },

  //
  // admin
  //
  oldadminGraphQLGet: {
    path: "/v1/project/:projectId/environment/:environmentId/graphql",
    method: "get",
    handler: adminGraphQL,
  },
  oldadminGraphQLPost: {
    path: "/v1/project/:projectId/environment/:environmentId/graphql",
    method: "post",
    handler: adminGraphQL,
  },
  cancelEmailReport: {
    path: "/v1/environment/:environmentId/user/:userId/unsubscribe/:report",
    method: "get",
    handler: cancelEmailReport,
  },
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
  deleteApiToken: {
    path: "/v1/project/:projectId/token/:tokenId",
    method: "delete",
    handler: deleteApiToken,
  },
  deleteTeamMember: {
    path: "/v1/project/:projectId/team/member/:userId",
    method: "delete",
    handler: deleteTeamMember,
  },
  deleteInvite: {
    path: "/v1/project/:projectId/invite/:inviteId",
    method: "delete",
    handler: deleteInvite,
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
  listTeamMembers: {
    path: "/v1/project/:projectId/team",
    method: "get",
    handler: listTeamMembers,
  },
  listInvites: {
    path: "/v1/project/:projectId/invites",
    method: "get",
    handler: listInvites,
  },
  listProjects: {
    path: "/v1/projects",
    method: "get",
    handler: listProjects,
  },
  searchGroups: {
    path: "/v1/project/:projectId/groups",
    method: "post",
    handler: searchGroups,
  },
  searchTemplates: {
    path: "/v1/project/:projectId/templates",
    method: "post",
    handler: searchTemplates,
  },
  createTemplate: {
    path: "/v1/project/:projectId/template",
    method: "post",
    handler: createTemplate,
  },
  listTargets: {
    path: "/v1/project/:projectId/targets",
    method: "get",
    handler: listTargets,
  },
  searchEvents: {
    path: "/v1/project/:projectId/events/search",
    method: "post",
    handler: searchEvents,
  },
  updateUser: {
    path: "/v1/user/:userId",
    method: "put",
    handler: updateUser,
  },
  adminGraphQL: {
    path: "/v1/graphql",
    method: "post",
    handler: adminGraphQL,
  },
  publicRenderEvent: {
    path: "/v1/public/render",
    method: "post",
    handler: publicRenderEvent,
  },

  //
  // enterprise
  //
  oldenterpriseCreateActiveSearch: {
    path: "/v1/eit/search/active",
    method: "post",
    handler: enterpriseCreateActiveSearch,
  },
  oldenterpriseCreateSavedSearch: {
    path: "/v1/eit/search/saved",
    method: "post",
    handler: enterpriseCreateSavedSearch,
  },
  oldenterpriseDeleteActiveSearch: {
    path: "/v1/eit/search/active/:activeSearchId",
    method: "delete",
    handler: enterpriseDeleteActiveSearch,
  },
  oldenterpriseGraphQLGet: {
    path: "/v1/eit/graphql",
    method: "get",
    handler: enterpriseGraphQL,
  },
  oldenterpriseGraphQLPost: {
    path: "/v1/eit/graphql",
    method: "post",
    handler: enterpriseGraphQL,
  },
  oldenterprisePumpActiveSearch: {
    path: "/v1/eit/search/active/:activeSearchId",
    method: "get",
    handler: enterprisePumpActiveSearch,
  },
  oldenterpriseSearchAdHoc: {
    path: "/v1/eit/search/adhoc",
    method: "get",
    handler: enterpriseSearchAdHoc,
  },

  //
  /// viewer
  //
  oldviewerCreateEitapiToken: {
    path: "/v1/project/:projectId/eitapi_token",
    method: "post",
    handler: viewerCreateEitapiToken,
  },
  oldviewerCreateExport: {
    path: "/v1/project/:projectId/export",
    method: "post",
    handler: viewerCreateExport,
  },
  oldviewerGraphQLGet: {
    path: "/v1/viewer/graphql",
    method: "get",
    handler: viewerGraphQL,
  },
  oldviewerGraphQLPost: {
    path: "/v1/viewer/graphql",
    method: "post",
    handler: viewerGraphQL,
  },
  oldviewerSearchEvents: {
    path: "/v1/viewer/:projectId/events/search",
    method: "post",
    handler: viewerSearchEvents,
  },
  oldviewerDeleteEitapiToken: {
    path: "/v1/project/:projectId/eitapi_token/:tokenId",
    method: "delete",
    handler: viewerDeleteEitapiToken,
  },
  oldviewerListEitapiTokens: {
    path: "/v1/project/:projectId/eitapi_tokens",
    method: "get",
    handler: viewerListEitapiTokens,
  },
  oldviewerListExports: {
    path: "/v1/project/:projectId/exports",
    method: "get",
    handler: viewerListExports,
  },
  oldviewerRenderSavedExport: {
    path: "/v1/project/:projectId/export/:exportId/rendered",
    method: "get",
    handler: viewerRenderSavedExport,
  },
  oldviewerUpdateEitapiToken: {
    path: "/v1/project/:projectId/eitapi_token/:tokenId",
    method: "put",
    handler: viewerUpdateEitapiToken,
  },
  oldviewerUpdateExport: {
    path: "/v1/project/:projectId/export/:exportId",
    method: "put",
    handler: viewerUpdateExport,
  },
};

export function LegacyRoutes() {
  return exports.default;
}
