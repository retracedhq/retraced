const Disq = require("disq");
const config = require("../config/getConfig")();
const dns = require("dns");

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
    disqueClient.connect()
      .then(() => {
        disqueClient.socket.setKeepAlive(true, 5000);
        disqueClient.socket.on("close", (hadError) => {
          if (hadError) {
            console.log("Disque connection closed. Will reconnect...");
            disqueClient = null;
          }
        });
      })
      .catch((err) => {
        console.log(err.stack);
        disqueClient = null;
      });
  }

  return disqueClient;
}

module.exports = getDisque;
