'use strict';

const Disq = require('disq');
const config = require('../config/getConfig')();

let disqueClient;

function getDisque() {
  if (!disqueClient) { 
    const opts = {
      nodes: config.Disque.Nodes,
    };
    if (config.Disque.Password) {
      opts.auth = config.Disque.Password;
    }
    disqueClient = new Disq(opts);
  }

  return disqueClient;
}

module.exports = getDisque;
