import { suite, test } from "@testdeck/mocha";
import { ApiSpec, removeRoutesNotMatching, filterAndAssign } from "../swagger";
import assert from "assert";

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

    let res = assert.strictEqual(swagger.paths["/admin/v1/project/{projectId}/apitoken"], undefined);
    res = assert(swagger.paths["/publisher/v1/project/{projectId}/event"]);
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

    let res = assert(specs[0].swagger.paths["/project/{projectId}/event"]);
    res = assert.strictEqual(specs[0].swagger.paths["/project/{projectId}/apitoken"], undefined);
    res = assert.strictEqual(specs[0].swagger.basePath, "/publisher/v1");
    res = assert.strictEqual(specs[0].swagger.info.description, specs[0].description);
    res = assert.strictEqual(specs[0].swagger.info.title, specs[0].title);

    res = assert.strictEqual(specs[1].swagger.paths["/project/{projectId}/event"], undefined);
    res = assert(specs[1].swagger.paths["/project/{projectId}/apitoken"]);
    res = assert.strictEqual(specs[1].swagger.basePath, "/admin/v1");
    res = assert.strictEqual(specs[1].swagger.info.description, specs[1].description);
    res = assert.strictEqual(specs[1].swagger.info.title, specs[1].title);
    return res;
  }
}

export default SwaggerTest;
