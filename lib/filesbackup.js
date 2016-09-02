var spawn = require("child_process").spawn;
var path = require("path");
var fs = require("fs");
var async = require("async");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var moment = require("moment");
var s3 = require("./s3");


var filesbackup = function () {};

filesbackup.prototype.connectS3 = function (config) {
  this.s3 = new s3(config);
  return this;
};

filesbackup.prototype.backupToS3 = function (filespath, bucket, filePrefix) {

  var self = this;
  var tmp = path.join(process.env.HOME, "tmp_filesbackup");

  async.waterfall([

    function (callback) {

      // create temp directory

      mkdirp(tmp, function (error, made) {
        callback(error, made);
      });
    },

    function (foldername, callback) {

      // zip the files

      console.log("Zipping files...");

      // source
      var parts = filespath.split("/");
      var sourceBase = parts.pop(); // files
      var sourceDirectory = parts.join("/"); // /var/www/html/hubapi/current/public/factory/sites/default

      // destination
      var destination = path.join(tmp, "files") + ".tgz";

      // spawn the process
      var tar = spawn("tar", ["-czf", destination, sourceBase], { cwd: sourceDirectory });

      tar.on("close", function (code) {
        callback(null, destination);
      });

      tar.on("error", function (error) {
        callback(error);
      });
    },

    function (filename, callback) {

      // upload to s3

      console.log("Uploading to s3...");

      var today = new moment();

      var readStream = fs.createReadStream(filename);

      filename = filePrefix ? filePrefix + "_" : "";
      filename += today.format("YYYY-MM-DD") + ".gz";

      var params = {
        Bucket: bucket,
        Key: filename,
        Body: readStream
      };

      self.s3.putObject(params, function(error, data) {
        callback(error, data, filename);
      });

    },

    function (data, filename, callback) {

      console.log("Successfully uploaded `" + filename + "` to s3.");

      // delete temp directory

      rimraf(tmp, function (error) {
        callback(error);
      });

    }

  ], function (error, result) {

      if (error) {
        throw error;
      }

  });

};

module.exports = new filesbackup();
