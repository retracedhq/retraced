import { expect } from "chai";
import moment from "moment-timezone";
import { describe, it } from "mocha";

import dailyReport, { Record } from "../daily_report";
import { fixProject } from "./common";

describe("models.environment.daily_report", () => {
  describe(`
    Bob, Ann, and Sam are on Project Alpha with environments Prod and Stage.
    Bob is in America/Los_Angeles, Ann is in US/Pacific, and Sam is in America/Chicago.
    Bob, Ann, and Sam are all subscribed to Prod environment.
    Only Ann is subscribed to Stage environment.
    Charlie is in US/Pacific on Project Beta subscribed to environments Prod and Stage.
    `, () => {
    const alpha = {
      id: crypto.randomUUID(),
      name: "Alpha",
      prodEnvID: crypto.randomUUID(),
      stageEnvID: crypto.randomUUID(),
      users: [
        {
          id: crypto.randomUUID(),
          email: "bob@example.com",
          timezone: "America/Los_Angeles",
          prod: true,
          stage: false,
        },
        {
          id: crypto.randomUUID(),
          email: "ann@example.com",
          timezone: "US/Pacific",
          prod: true,
          stage: true,
        },
        {
          id: crypto.randomUUID(),
          email: "sam@example.com",
          timezone: "America/Chicago",
          prod: true,
          stage: false,
        },
      ],
    };
    /* eslint-disable */
    const [bob, ann, sam] = alpha.users;
    /* eslint-enable */
    const beta = {
      id: crypto.randomUUID(),
      name: "Beta",
      prodEnvID: crypto.randomUUID(),
      stageEnvID: crypto.randomUUID(),
      users: [
        {
          id: crypto.randomUUID(),
          email: "charlie@example.com",
          timezone: "US/Pacific",
          prod: true,
          stage: true,
        },
      ],
    };
    const charlie = beta.users[0];

    fixProject(alpha);
    fixProject(beta);
    const tz = moment.tz.zone("America/Los_Angeles");
    const offset = tz ? -tz.parse(Date.now()) / 60 : 0;
    describe(`Search for offset ${offset}`, () => {
      it(`
        Should return a record for Alpha.Prod with recipients Bob and Ann.
        Should return a record for Alpha.Stage with recipient Ann.
        Should return a record for Beta.Prod with recipient Charlie.
        Should return a record for Beta.Stage with recipient Charlie.
        `, () => {
        return dailyReport({ offsetHour: offset }).then((records) => {
          const alphaProd = records.find(
            ({ project_name, environment_name }) => project_name === "Alpha" && environment_name === "Prod"
          ) as Record;
          const alphaStage = records.find(
            ({ project_name, environment_name }) => project_name === "Alpha" && environment_name === "Stage"
          ) as Record;
          const betaProd = records.find(
            ({ project_name, environment_name }) => project_name === "Beta" && environment_name === "Prod"
          ) as Record;
          const betaStage = records.find(
            ({ project_name, environment_name }) => project_name === "Beta" && environment_name === "Stage"
          ) as Record;

          expect(alphaProd).not.to.equal(undefined);
          expect(alphaProd.recipients).to.have.length(2);
          expect(alphaProd.recipients).to.deep.include.members([
            {
              email: bob.email,
              id: bob.id,
              token: "xyz",
            },
            {
              email: ann.email,
              id: ann.id,
              token: "xyz",
            },
          ]);
          expect(alphaStage).not.to.equal(undefined);
          expect(alphaStage.recipients).to.deep.equal([
            {
              email: ann.email,
              id: ann.id,
              token: "xyz",
            },
          ]);
          expect(betaProd).not.to.equal(undefined);
          expect(betaProd.recipients).to.deep.equal([
            {
              email: charlie.email,
              id: charlie.id,
              token: "xyz",
            },
          ]);
          expect(betaStage).not.to.equal(undefined);
          expect(betaStage.recipients).to.deep.equal([
            {
              email: charlie.email,
              id: charlie.id,
              token: "xyz",
            },
          ]);
        });
      });
    });
  });

  describe(`
    Dan, Esther, and Frank are on Project Gamma subscribed to Prod and Stage environments.
    Dan is in Dhaka (+6), Esther is in Calcutta (+5:30), and Frank is in Kathmandu (+5:45)
  `, () => {
    const gamma = {
      id: crypto.randomUUID(),
      name: "Gamma",
      prodEnvID: crypto.randomUUID(),
      stageEnvID: crypto.randomUUID(),
      users: [
        {
          id: crypto.randomUUID(),
          email: "dan@example.com",
          timezone: "Asia/Dhaka",
          prod: true,
          stage: true,
        },
        {
          id: crypto.randomUUID(),
          email: "esther@example.com",
          timezone: "Asia/Calcutta",
          prod: true,
          stage: true,
        },
        {
          id: crypto.randomUUID(),
          email: "frank@example.com",
          timezone: "Asia/Kathmandu",
          prod: true,
          stage: true,
        },
      ],
    };
    const [dan, esther, frank] = gamma.users;

    fixProject(gamma);

    describe("Searching for +6", () => {
      it("Should return records for all six environment/offsets", () => {
        return dailyReport({ offsetHour: 6 }).then((records) => {
          const prod6 = records.find(
            ({ environment_name, utc_offset }) => environment_name === "Prod" && utc_offset === 360
          ) as Record;
          const stage6 = records.find(
            ({ environment_name, utc_offset }) => environment_name === "Stage" && utc_offset === 360
          ) as Record;
          const prod530 = records.find(
            ({ environment_name, utc_offset }) => environment_name === "Prod" && utc_offset === 330
          ) as Record;
          const stage530 = records.find(
            ({ environment_name, utc_offset }) => environment_name === "Stage" && utc_offset === 330
          ) as Record;
          const prod545 = records.find(
            ({ environment_name, utc_offset }) => environment_name === "Prod" && utc_offset === 345
          ) as Record;
          const stage545 = records.find(
            ({ environment_name, utc_offset }) => environment_name === "Stage" && utc_offset === 345
          ) as Record;

          expect(prod6.recipients).to.deep.equal([
            {
              email: dan.email,
              id: dan.id,
              token: "xyz",
            },
          ]);
          expect(stage6.recipients).to.deep.equal([
            {
              email: dan.email,
              id: dan.id,
              token: "xyz",
            },
          ]);
          expect(prod530.recipients).to.deep.equal([
            {
              email: esther.email,
              id: esther.id,
              token: "xyz",
            },
          ]);
          expect(stage530.recipients).to.deep.equal([
            {
              email: esther.email,
              id: esther.id,
              token: "xyz",
            },
          ]);
          expect(prod545.recipients).to.deep.equal([
            {
              email: frank.email,
              id: frank.id,
              token: "xyz",
            },
          ]);
          expect(stage545.recipients).to.deep.equal([
            {
              email: frank.email,
              id: frank.id,
              token: "xyz",
            },
          ]);
        });
      });
    });
  });
});
