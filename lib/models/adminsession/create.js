require('datejs');
const jwt = require('jsonwebtoken');
const config = require('../../config/getConfig')();
function createAdminsession(opts) {
    return new Promise((resolve, reject) => {
        const claims = {
            user_id: opts.user.id,
            expiry: Date.today().add(21).days(),
        };
        resolve(jwt.sign(claims, config.Session.HMACSecret));
    });
}
module.exports = createAdminsession;
//# sourceMappingURL=create.js.map