/*
 * Emailer renders named templates and sends the html to recipient addresses.
 *
 * The default instance first checks for SMTP_CONNECTION_URL, then falls back
 * to MANDRILL_KEY.
 *
 * Optionally filters out recipients with their tx_email_recipient flag off in
 * retraceduser table in Postgres.
 *
 * Optionallly turns off the tx_email_recipient flag in retraceduser on certain
 * classes of permanent bounces.
 */
import nodemailer from "nodemailer";
import mandrillTransport from "nodemailer-mandrill-transport";
import _ from "lodash";
import pg from "pg";
import inviteTmpl from "./templates/inviteToTeam";
import reportTmpl from "./templates/reportDay";
import deletionRequestTmpl from "./templates/deletionRequest";
import getPgPool from "../persistence/pg";
import { logger } from "../logger";
import config from "../../config";
import { incrementOtelCounter, instrumented } from "../../metrics/opentelemetry/instrumentation";

export interface Email {
  to: string | string[];
  subject: string;
  template: string;
  context: any;
}

interface MandrillResult {
  _id: string;
  email: string;
  status: "sent" | "queued" | "rejected" | "invalid";
  reject_reason?:
    | "hard-bounce"
    | "soft-bounce"
    | "spam"
    | "unsub"
    | "custom"
    | "invalid-sender"
    | "invalid"
    | "test-mode-limit"
    | "unsigned"
    | "rule";
}

// Returns the no-send-list.
export type RecipientFilter = (recipients: string[]) => Promise<string[]>;

export class Emailer {
  public static getDefault(): Emailer {
    if (!Emailer.instance) {
      let transport = Emailer.smtpFromEnv();
      let handleRejects;

      if (!transport) {
        transport = Emailer.mandrillFromEnv();
        handleRejects = Emailer.mandrillRejectHandler(getPgPool());
      }

      if (!transport) {
        throw new Error("Either SMTP or Mandrill must be configured");
      }

      Emailer.instance = new Emailer(
        transport,
        Emailer.defaultTemplates(),
        config.EMAIL_FROM || "Retraced <retraced@boxyhq.com>",
        handleRejects
      );
    }

    return Emailer.instance;
  }

  public static defaultTemplates(): Map<string, (context: any) => string> {
    const templates = new Map();

    templates.set("retraced/invite-to-team", inviteTmpl);
    templates.set("retraced/report-day", reportTmpl);
    templates.set("retraced/deletion-request", deletionRequestTmpl);

    return templates;
  }

  public static smtpFromEnv(): nodemailer.Transporter | null {
    if (!config.SMTP_CONNECTION_URL) {
      return null;
    }

    logger.info("Configured SMTP for sending emails");

    return nodemailer.createTransport(config.SMTP_CONNECTION_URL);
  }

  public static mandrillFromEnv(): nodemailer.Transporter | null {
    if (!config.MANDRILL_KEY) {
      return null;
    }

    logger.info("Configured Mandrill for sending emails");

    return nodemailer.createTransport(
      mandrillTransport({
        auth: {
          apiKey: config.MANDRILL_KEY,
        },
      })
    );
  }

  public static mandrillRejectHandler(pgPool: pg.Pool) {
    return (results: MandrillResult[]) => {
      // the list of email addresses that cannot ever receive or do not want more emails
      const rejections = results
        .filter((result: MandrillResult): boolean => {
          if (result.status === "invalid") {
            logger.error(`Mandrill send to ${result.email} invalid`);
            return false;
          }
          incrementOtelCounter("Emailer.mandrillRejectHandler", 1, { reject_reason: result.reject_reason });
          logger.warn(`Mandrill send to ${result.email} rejected: ${result.reject_reason}`);

          switch (result.reject_reason) {
            case "hard-bounce":
            case "spam":
            case "unsub":
              return true;
            default:
              return false;
          }
        })
        .map(({ email }) => email);

      pgPool
        .query(
          `
                update retraceduser
                set tx_emails_recipient = false
                where email = any($1)`,
          [rejections]
        )
        .catch((err) => {
          logger.error(`Failed to turn off tx email receiving for ${rejections}: ${err.message}`);
        });
    };
  }

  private static instance: Emailer;

  constructor(
    private readonly transport: nodemailer.Transporter,
    private readonly templates: Map<string, (context: any) => string>,
    private readonly from: string,
    private readonly onRejected?: (rejected: any[]) => void
  ) {}

  @instrumented
  public async send(email: Email) {
    const tmpl = this.templates.get(email.template);

    if (!tmpl) {
      throw new Error(`Emailer does not have template ${email.template}`);
    }

    const recipients = Array.isArray(email.to) ? email.to : [email.to];

    return new Promise((resolve, reject) => {
      const rendered = {
        from: this.from,
        to: recipients.join(", "),
        subject: email.subject,
        html: tmpl(email.context),
      };

      this.transport.sendMail(rendered, (err, info) => {
        if (err) {
          logger.error(`Failure sending "${email.template}" email to ${email.to}`);
          reject(err);
          return;
        }
        logger.info(`Delivered "${email.template}" email to ${email.to}`);

        if (!_.isEmpty(info.rejected) && typeof this.onRejected === "function") {
          this.onRejected(info.rejected);
        }

        resolve(info);
      });
    });
  }
}
