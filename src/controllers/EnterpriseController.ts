
import { Post, Route, Body, Header, SuccessResponse, Controller, Example } from "tsoa";

import { enterpriseCreateActiveSearch } from "../handlers/enterprise/createActiveSearch";
import { ActiveSearchId, CreateActiveSearchRequest } from "../handlers/enterprise/createActiveSearch";
/*
import enterpriseCreateSavedSearch from "../handlers/enterprise/createSavedSearch";
import enterpriseDeleteActiveSearch from "../handlers/enterprise/deleteActiveSearch";
import enterpriseGraphQL from "../handlers/enterprise/graphql";
import enterprisePumpActiveSearch from "../handlers/enterprise/pumpActiveSearch";
import enterpriseSearchAdHoc from "../handlers/enterprise/searchAdHoc";
*/
/*
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
*/

@Route("enterprise/v1")
export class EnterpriseAPI extends Controller {

    /**
     * Initiate an active search. An active search will maintain
     * a persistent cursor that can be used at a later date to
     * retrieve additional events from the search.
     *
     *
     * Authenticate with an Enterprise API token.
     *
     * @param auth      header of the form token=...
     * @param request     The event body to log
     */
    @Post("search/active")
    @SuccessResponse("201", "Created")
    @Example<ActiveSearchId>({
        id: "abf053dc4a3042459818833276eec717",
    })
    public async createEvent(
        @Header("Authorization") auth: string,
        @Body() request: CreateActiveSearchRequest,
    ): Promise<ActiveSearchId> {

        const result: ActiveSearchId = await enterpriseCreateActiveSearch(auth, request);

        this.setStatus(201);
        return result;

    }

}
