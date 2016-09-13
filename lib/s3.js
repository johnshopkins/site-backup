var aws = require("aws-sdk");

/**
 * Some good examples here:
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html#Amazon_Simple_Storage_Service__Amazon_S3_
 */


var s3 = function (config) {
  aws.config.update(config);
  this.s3 = new aws.S3();
};

s3.prototype.listObjects = function (params, callback) {
 this.s3.listObjects(params, callback);
};

s3.prototype.deleteObjects = function (params, callback) {
  this.s3.deleteObjects(params, callback);
};

s3.prototype.upload = function (params, callback) {

  var upload = this.s3.upload(params, callback);

  upload.on("httpUploadProgress", function (event) {
    var percent = (event.loaded / event.total) * 100;
    console.log(percent + "% of " + event.key + " upload complete. " + event.loaded + "/" + event.total);
  });

};

module.exports = s3;
