import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";

import nodemailer from "nodemailer";
import Handlebars from "handlebars";

import { Emailer } from "../../services/Emailer";

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

    expect(msg).to.have.property("html", "Hello, Fran");
    expect(msg).to.have.property("subject", "Hello!");
    expect(msg.from).to.deep.equal({
      address: "contact@retraced.io",
      name: "Retraced",
    });
    expect(msg.to).to.deep.equal([
      {
        address: "user@example.com",
        name: "",
      },
    ]);
  }
}

export default EmailerTest;
