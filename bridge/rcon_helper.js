const { Rcon } = require("rcon-client");
const CFG = require("./config");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createRcon() {
  const rcon = new Rcon({
    host: CFG.rcon.host,
    port: CFG.rcon.port,
    password: CFG.rcon.password,
    timeout: CFG.rcon.timeout,
  });

  let cmdCount = 0;
  const originalSend = rcon.send.bind(rcon);

  // Wrapped send with rate limiting: pause 100ms every 5 commands
  rcon.sendRL = async function (cmd) {
    const result = await originalSend(cmd);
    cmdCount++;
    if (cmdCount % 5 === 0) await sleep(100);
    return result;
  };

  return rcon;
}

module.exports = { createRcon, sleep };
