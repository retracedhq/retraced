import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { ApiSpec, removeRoutesNotMatching, filterAndAssign } from "../swagger";

@suite
class SwaggerTest {
  @test public "swagger.removeRoutesNotMatching"() {
    const swagger = {
      paths: {
        "/publisher/v1/project/{projectId}/event": {
          stuff: "k",
        },
        "/admin/v1/project/{projectId}/apitoken": {
          stuff: "nah",
        },
      },
    };

    removeRoutesNotMatching(swagger, /^\/publisher\/v1/);

    let res = expect(swagger.paths["/admin/v1/project/{projectId}/apitoken"])
      .not.to.exist;
    res = expect(swagger.paths["/publisher/v1/project/{projectId}/event"]).to
      .exist;
    return res;
  }

  @test public "swagger.filterAndAssign"() {
    const swagger = {
      paths: {
        "/publisher/v1/project/{projectId}/event": {
          stuff: "k",
        },
        "/admin/v1/project/{projectId}/apitoken": {
          stuff: "nah",
        },
      },
    };

    const specs: ApiSpec[] = [
      {
        match: /^\/publisher\/v1/,
        path: "/publisher/v1",
        title: "Publisher API",
        description: "APIs for vendor integration with the Retraced Platform",
      },
      {
        match: /^\/admin\/v1/,
        path: "/admin/v1",
        title: "Admin API",
        description: "APIs used by the Retraced Admin web UI",
      },
    ];

    filterAndAssign(swagger, specs);

    let res = expect(specs[0].swagger.paths["/project/{projectId}/event"]).to
      .exist;
    res = expect(specs[0].swagger.paths["/project/{projectId}/apitoken"]).not.to
      .exist;
    res = expect(specs[0].swagger.basePath).to.equal("/publisher/v1");
    res = expect(specs[0].swagger.info.description).to.equal(
      specs[0].description
    );
    res = expect(specs[0].swagger.info.title).to.equal(specs[0].title);

    res = expect(specs[1].swagger.paths["/project/{projectId}/event"]).not.to
      .exist;
    res = expect(specs[1].swagger.paths["/project/{projectId}/apitoken"]).to
      .exist;
    res = expect(specs[1].swagger.basePath).to.equal("/admin/v1");
    res = expect(specs[1].swagger.info.description).to.equal(
      specs[1].description
    );
    res = expect(specs[1].swagger.info.title).to.equal(specs[1].title);
    return res;
  }
}

export default SwaggerTest;
