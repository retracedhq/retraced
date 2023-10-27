import axios from "axios";
import config from "../config";
import { Component, componentKind } from "../types";
import { WebSocket } from "ws";
import { createClient } from "graphql-ws";

const getAllComponents = (): Promise<Component[]> => {
  return new Promise((resolve, reject) => {
    const body = {
      operationName: null,
      variables: {},
      query: `{
      components {
        edges {
          node {
            componentId
            componentType
          }
        }
      }
    }`,
    };
    axios
      .post(`http://localhost:${config.vectorAPIPort}/graphql`, body)
      .then((response) => {
        resolve((response.data?.data?.components?.edges || []).map((edge) => edge.node));
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

const getAllComponentsByType = (type: componentKind): Promise<Component[]> => {
  return new Promise((resolve, reject) => {
    const body = {
      operationName: null,
      variables: {},
      query: `{
      components(first: 65535, filter: { componentKind: { equals: ${type} } }) {
        edges {
          node {
            componentId
            componentType
          }
        }
      }
    }`,
    };
    const url = `http://localhost:${config.vectorAPIPort}/graphql`;

    axios
      .post(url, body)
      .then((response) => {
        const data = response.data;
        const components = data?.data?.components?.edges || [];
        const result = components.map((edge) => edge.node);
        resolve(result);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

const getComponentByName = (name: string): Promise<Component> => {
  return new Promise((resolve, reject) => {
    const body = {
      operationName: null,
      variables: {},
      query: `{
        componentByComponentKey(componentId: "${name}") {
          componentId
          componentType
          # Other fields and metrics
        }
      }`,
    };
    const url = `http://localhost:${config.vectorAPIPort}/graphql`;

    axios
      .post(url, body)
      .then((response) => {
        const data = response.data;
        console.log(data);
        resolve(data?.data?.componentByComponentKey);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

const client = createClient({
  url: `ws://localhost:${config.vectorAPIPort}/graphql`,
  webSocketImpl: WebSocket,
});

export default {
  getAllComponentsByType,
  getAllComponents,
  getComponentByName,
  graphQLWSClient: client,
};
