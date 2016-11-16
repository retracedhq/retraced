'use strict';

const Disque = require('disqueue-node');
const config = require('../config/getConfig')();

let disqueClient;

function getDisque() {
  if (!disqueClient) {
    const opts = {
      host: config.Disque.Host,
      port: config.Disque.Port,
    };
    if (config.Disque.Password) {
      opts.auth = {
        password: config.Disque.Password,
      };
    }
    disqueClient = new Disque(opts);
  }

  return disqueClient;
}

module.exports = getDisque;
