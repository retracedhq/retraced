const getApiToken = require('../models/apitoken/get');
function validateApiToken(event) {
    return new Promise((resolve, reject) => {
        let token;
        const authHeaderParts = event.headers['Authorization'].split(' ');
        if ((authHeaderParts.length === 2) && (authHeaderParts[0] === 'Token')) {
            const tokenParts = authHeaderParts[1].split('=');
            if ((tokenParts.length === 2) && (tokenParts[0] === 'token')) {
                token = tokenParts[1];
            }
        }
        if (!token) {
            reject(new Error('No token'));
            return;
        }
        getApiToken(token)
            .then(resolve)
            .catch(reject);
    });
}
module.exports = validateApiToken;
//# sourceMappingURL=validateApiToken.js.map