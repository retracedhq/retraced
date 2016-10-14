'use strict';

module.exports.default = (event, context, cb) => {
  cb(new Error('[500] test'));
};
