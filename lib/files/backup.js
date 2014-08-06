var exec = require("child_process").exec;
var path = require("path");
var fs = require("fs");
var async = require("async");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var moment = require("moment");
var s3 = require("../s3");


var filesbackup = function () {};

filesbackup.prototype.connectS3 = function (config) {
  this.s3 = new s3(config);
  return this;
};

filesbackup.prototype.backupToS3 = function (filespath, bucket, filePrefix) {

  var self = this;
  var tmp = path.join(process.env.HOME, "tmp_backup");

  async.waterfall([

    function (callback) {

      // create temp directory
      
      mkdirp(tmp, function (error, made) {
        callback(error, made);
      });
    },

    function (made, callback) {

      // copy the files

      var foldername = path.join(tmp, "files");

      var cmd = "cp -RL " + filespath + " " + foldername;
      exec(cmd, function (error, stdout, stderror) {
        callback(error, foldername);
      });

    },

    function (foldername, callback) {

      console.log("Files copied.");

      // zip the directory

      var filename = foldername + ".tgz";
      var cmd = "tar -czf " + filename + " " + foldername;

      console.log("Zipping files...");

      exec(cmd, function (error, stdout, stderr) {
        callback(error, filename);
      });

    },

    function (filename, callback) {

      console.log("Files zipped.");

      // read in file contents

      fs.readFile(filename, function (error, data) {
        callback(error, data, filename);
      });
      
    },

    function (data, filename, callback) {

      // upload to s3
      
      console.log("Uploading to s3...");
      
      var today = new moment();

      var filename = filePrefix ? filePrefix + "_" : "";
      filename += today.format("YYYY-MM-DD") + ".sql.gz";

      var params = {
        Bucket: bucket,
        Key: filename,
        Body: data 
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

module.exports = new filesbackup();
