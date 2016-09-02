var exec = require("child_process").exec;
var path = require("path");
var fs = require("fs");
var async = require("async");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var moment = require("moment");
var s3 = require("./s3");


var dbbackup = function () {};

dbbackup.prototype.connectDb = function (dbsettings) {
  this.dbsettings = dbsettings;
  return this;
};

dbbackup.prototype.connectS3 = function (config) {
  this.s3 = new s3(config);
  return this;
};

dbbackup.prototype.backupToS3 = function (bucket, filePrefix) {

  var self = this;
  var tmp = path.join(process.env.HOME, "tmp_dbbackup");

  async.waterfall([

    function (callback) {

      // create temp directory

      mkdirp(tmp, function (error, made) {
        callback(error, made);
      });
    },

    function (made, callback) {

      // save the db to disk

      var filename = path.join(tmp, self.dbsettings.database + ".sql");

      // var cmd = "mysqldump -u " + self.dbsettings.user + " --password=" + self.dbsettings.password + " -h " + self.dbsettings.host + " " + self.dbsettings.database + " --set-gtid-purged=OFF > " + filename;
      var cmd = "mysqldump -u " + self.dbsettings.user + " --password=" + self.dbsettings.password + " -h " + self.dbsettings.host + " " + self.dbsettings.database + " > " + filename;
      exec(cmd, function (error, stdout, stderror) {
        callback(error, filename);
      });

    },

    function (filename, callback) {

      console.log("Database downloaded.");

      // gzip

      var cmd = "gzip -f " + filename;
      exec(cmd, function (error, stdout, stderr) {
        filename = filename + ".gz";
        callback(error, filename);
      });

    },

    function (filename, callback) {

      // upload to s3

      var today = new moment();

      var readStream = fs.createReadStream(filename);

      var filename = filePrefix ? filePrefix + "_" : "";
      filename += today.format("YYYY-MM-DD") + ".sql.gz";

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
        return;
      }

  });

};

module.exports = new dbbackup();
