import { suite, test } from "@testdeck/mocha";

import nodemailer from "nodemailer";
import Handlebars from "handlebars";

import { Emailer } from "../../services/Emailer";
import assert from "assert";

@suite
class EmailerTest {
  @test public async "Emailer.sendEmail()"() {
    const from = "Retraced <contact@retraced.io>";
    const transport = nodemailer.createTransport({
      jsonTransport: true,
    });
    const templates = new Map();

    templates.set("greet", Handlebars.compile("Hello, {{name}}"));

    const emailer = new Emailer(transport, templates, from);
    const email = {
      subject: "Hello!",
      to: "user@example.com",
      template: "greet",
      context: {
        name: "Fran",
      },
    };

    const result: any = await emailer.send(email);
    const msg = JSON.parse(result.message);

    assert.strictEqual(msg.html, "Hello, Fran");
    assert.strictEqual(msg.subject, "Hello!");
    assert.deepEqual(msg.from, {
      address: "contact@retraced.io",
      name: "Retraced",
    });
    assert.deepEqual(msg.to, [
      {
        address: "user@example.com",
        name: "",
      },
    ]);
  }
}

export default EmailerTest;
