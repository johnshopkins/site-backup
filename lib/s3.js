var aws = require("aws-sdk");

var s3 = function (config) {
  aws.config.update(config);
  this.s3 = new aws.S3();
};

s3.prototype.putObject = function (params, callback) {
  this.s3.putObject(params, callback);
};

s3.prototype.listObjects = function (params, callback) {
 this.s3.listObjects(params, callback);
};

s3.prototype.deleteObjects = function (params, callback) {
  this.s3.deleteObjects(params, callback);
};

module.exports = s3;
