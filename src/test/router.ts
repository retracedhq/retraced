import { suite, test } from "@testdeck/mocha";
import * as TypeMoq from "typemoq";

import express from "express";

import { onError } from "../router";

const once = TypeMoq.Times.once;

@suite
class RouterTest {
  @test
  public "router.onError()({status: 400, message: 'Authorization is a required header parameter.'})"() {
    const res = TypeMoq.Mock.ofType<express.Response>();
    const reqId = "8675309";
    const err = {
      status: 400,
      message: "Authorization is a required header parameter.",
    };
    const expected = {
      status: 400,
      error: err.message,
      type: "Error",
    };

    res
      .setup((x) => x.status(400))
      .returns(() => res.object)
      .verifiable(once());
    res
      .setup((x) => x.set("X-Retraced-RequestId", reqId))
      .returns(() => res.object)
      .verifiable(once());
    res
      .setup((x) => x.json(TypeMoq.It.isObjectWith(expected)))
      .verifiable(once());

    onError(res.object, reqId)(err);

    res.verifyAll();
  }

  @test
  public "router.onError()({status: 400, err: new Error('Authorization is a required header parameter.')})"() {
    const res = TypeMoq.Mock.ofType<express.Response>();
    const reqId = "8675309";
    const err = {
      status: 400,
      err: new Error("Authorization is a required header parameter."),
    };
    err.err.stack = "<stacktrace omitted for brevity>";

    res
      .setup((x) => x.status(400))
      .returns(() => res.object)
      .verifiable(once());
    res
      .setup((x) => x.set("X-Retraced-RequestId", reqId))
      .returns(() => res.object)
      .verifiable(once());

    onError(res.object, reqId)(err);

    const expected = {
      status: 400,
      error: err.err.message,
      type: "Error",
    };

    res.verify((x) => x.json(TypeMoq.It.isObjectWith(expected)), once());
  }

  @test
  public "router.onError()(new Error('Cant set headers after they are sent'))"() {
    const res = TypeMoq.Mock.ofType<express.Response>();
    const reqId = "8675309";
    const err = new Error("Cant set headers after they are sent");
    err.stack = "<stacktrace omitted for brevity>";

    res
      .setup((x) => x.status(500))
      .returns(() => res.object)
      .verifiable(once());
    res
      .setup((x) => x.set("X-Retraced-RequestId", reqId))
      .returns(() => res.object)
      .verifiable(once());

    onError(res.object, reqId)(err);

    const expected = {
      status: 500,
      error: err.message,
      type: "Error",
    };

    res.verify((x) => x.json(TypeMoq.It.isObjectWith(expected)), once());
  }
}

export default RouterTest;
