const fs = require('fs');
function getConfig() {
    return JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
}
module.exports = getConfig;
//# sourceMappingURL=getConfig.js.map