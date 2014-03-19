var sdk = require("aws-sdk");

module.exports.connect = function (config) {

  sdk.config.update({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey
  });

  sdk.config.update({region: config.region});

  return sdk;
  
};