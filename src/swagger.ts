// tslint:disable-next-line
const swaggerJSDoc = require("swagger-jsdoc");
import * as util from "util";

const apiHost = process.env.RETRACED_API_BASE || "http://localhost:3000";

const publisher = {
  info: {
    title: "Publisher API",
    version: "1.0.0",
    description: "Public API for publishing events and creating viewer descriptors",
  },
  host: apiHost,
  basePath: "/publisher/v1",
};

const options = {
  swaggerDefinition: publisher,
  apis: ["./build/handlers/createEvent.js", "./build/handlers/createViewerDescriptor.js"],
};

const publisherSpec = swaggerJSDoc(options);
console.log(util.inspect(publisherSpec, false, 100 , true));

export { publisherSpec };
