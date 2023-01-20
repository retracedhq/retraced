import { Body, Controller, Request, Example, Header, Post, Route, SuccessResponse } from "tsoa";
import { Request as Req } from "express";

import {
  ActiveSearchId,
  CreateActiveSearchRequest,
  enterpriseCreateActiveSearch,
} from "../handlers/enterprise/createActiveSearch";
import {
  createSavedSearchHandler,
  CreateSavedSearchRequest,
  SavedSearch,
} from "../handlers/enterprise/createSavedSearch";
import { GraphQLRequest, GraphQLResp } from "../handlers/graphql/";
import { Scope } from "../security/scope";
import { checkEitapiAccessUnwrapped } from "../security/helpers";
import { graphql } from "graphql";
import schema from "../handlers/graphql/schema";
import { EnterpriseToken } from "../models/eitapi_token";
import { CreateEventRequest, defaultEventCreater } from "../handlers/createEvent";
/*
import enterpriseCreateSavedSearch from "../handlers/enterprise/createSavedSearch";
import enterpriseDeleteActiveSearch from "../handlers/enterprise/deleteActiveSearch";
import enterpriseGraphQL from "../handlers/enterprise/graphql";
import enterprisePumpActiveSearch from "../handlers/enterprise/pumpActiveSearch";
import enterpriseSearchAdHoc from "../handlers/enterprise/searchAdHoc";
*/

/*
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
*/

@Route("enterprise/v1")
export class EnterpriseAPI extends Controller {
  /**
   * Query events with GraphQL
   *
   * https://boxyhq.com/docs/retraced/apis/graphql
   *
   * @param auth            auth header of the form Token token= ...
   * @param projectId       the project id
   * @param graphQLRequest  graphQL query, variables, and operationName
   */
  @Post("graphql")
  @SuccessResponse("200", "OK")
  public async graphqlPost(
    @Header("Authorization") auth: string,
    @Body() graphQLRequest: GraphQLRequest,
    @Request() req: Req
  ): Promise<GraphQLResp> {
    const token: EnterpriseToken = await checkEitapiAccessUnwrapped(auth);

    const context: Scope = {
      projectId: token.project_id,
      environmentId: token.environment_id,
      groupId: token.group_id,
    };

    const result: GraphQLResp = (await graphql({
      schema,
      source: graphQLRequest.query,
      rootValue: null,
      contextValue: context,
      variableValues: graphQLRequest.variables as {
        [variable: string]: unknown;
      },
      operationName: graphQLRequest.operationName,
    })) as GraphQLResp;

    const thisViewEvent: CreateEventRequest = {
      action: token.view_log_action,
      crud: "r",
      actor: {
        id: `enterprise:${token.id.substring(0, 7)}`,
        name: token.display_name,
      },
      group: {
        id: token.group_id,
      },
      description: `Exported audit log events`,
      source_ip: req.ip,
    };
    defaultEventCreater.saveRawEvent(token.project_id, token.environment_id, thisViewEvent);

    this.setStatus(result.errors ? 400 : 200);

    return result;
  }

  /**
   * Initiate an active search. An active search will maintain
   * a persistent cursor that can be used at a later date to
   * retrieve additional events from the search.
   *
   *
   * Authenticate with an Enterprise API token.
   *
   * @param auth      header of the form token= ...
   * @param request     The search params
   */
  @Post("search/active")
  @SuccessResponse("201", "Created")
  @Example<ActiveSearchId>({
    id: "abf053dc4a3042459818833276eec717",
  })
  public async createActiveSearch(
    @Header("Authorization") auth: string,
    @Body() request: CreateActiveSearchRequest
  ): Promise<ActiveSearchId> {
    const result: ActiveSearchId = await enterpriseCreateActiveSearch(auth, request);

    this.setStatus(201);
    return result;
  }

  /**
   * Create a saved search.
   * Saved searches have an ID that can be used to initiate an active search.
   *
   * Authenticate with an Enterprise API token.
   *
   * @param auth      header of the form token= ...
   * @param request   The search parameters
   */
  @Post("search/saved")
  @SuccessResponse("201", "Created")
  @Example<SavedSearch>({
    id: "05abf3dc4a30bf45981883327c7176ee",
  })
  public async createSavedSearch(
    @Header("Authorization") auth: string,
    @Body() request: CreateSavedSearchRequest
  ): Promise<SavedSearch> {
    const result: SavedSearch = await createSavedSearchHandler(auth, request);

    this.setStatus(201);
    return result;
  }
}
