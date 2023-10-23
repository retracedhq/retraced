import * as request from 'request';
import config from '../config';
import { Component, componentKind } from '../types';
import { WebSocket } from 'ws';
import { createClient } from 'graphql-ws';

const getAllComponents = (): Promise<Component[]> => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
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
    });
    request.post(`http://localhost:${config.vectorAPIPort}/graphql`, { body }, (err, response, body) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        body = JSON.parse(body);
        resolve((body?.data?.components?.edges || []).map((edge) => edge.node));
      }
    });
  });
};

const getAllComponentsByType = (type: componentKind): Promise<Component[]> => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
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
    });
    request.post(`http://localhost:${config.vectorAPIPort}/graphql`, { body }, (err, response, body) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        body = JSON.parse(body);
        resolve((body?.data?.components?.edges || []).map((edge) => edge.node));
      }
    });
  });
};

const getComponentByName = (name: string): Promise<Component> => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      operationName: null,
      variables: {},
      query: `{
        componentByComponentKey(componentId: "${name}") {
          componentId
          componentType
          # Other fields and metrics
        }
      }`,
    });
    request.post(`http://localhost:${config.vectorAPIPort}/graphql`, { body }, (err, response, body) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        body = JSON.parse(body);
        console.log(body);
        resolve(body?.data?.componentByComponentKey);
      }
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
