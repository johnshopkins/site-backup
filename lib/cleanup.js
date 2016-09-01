var _ = require("underscore");
var moment = require("moment");
var s3 = require("./s3");

var cleanup = function (bucket, fileprefix) {
  this.bucket = bucket;
  this.fileprefix = fileprefix || "";
  this.today = moment();
};

cleanup.prototype.connectS3 = function (config) {
  this.s3 = new s3(config);
  return this;
};

cleanup.prototype.cleanup = function () {

  var cleaner = this;

  cleaner.getObjects(cleaner.bucket, function (error, objects) {

    if (error) {
      throw error;
    }

    var toDelete = cleaner.findObjectsToDelete(objects);

    if (toDelete.length === 0) {
      console.log("Nothing to cleanup in " + cleaner.bucket + " bucket. Exiting");
      return;
    }

    cleaner.deleteObjects(cleaner.bucket, toDelete, function (error, data) {

      if (error) {
        throw error;
      }

      console.log("Old backups removed from " + cleaner.bucket + " bucket.");

    });

  });

};

cleanup.prototype.getObjects = function (bucket, callback) {

  var params = {
    Bucket: bucket || this.bucket
  };

  this.s3.listObjects(params, function (err, data) {
    var objects = data.Contents;
    if (callback && typeof callback == "function") callback(err, objects);
  });

};

cleanup.prototype.deleteObjects = function (bucket, objects, callback) {

  var params = {
    Bucket: bucket,
    Delete: { Objects: objects }
  };

  this.s3.deleteObjects(params, function (err, data) {
    callback(err, data);
  });

};

cleanup.prototype.findObjectsToDelete = function (objects) {

  var cleaner = this;

  var toDelete = [];

  _.each(objects, function (item) {

    var deleteItem = cleaner.analyzeObject(item.Key);

    if (deleteItem) {
      toDelete.push({ Key: item.Key });
    }

  });

  return toDelete;

};

cleanup.prototype.analyzeObject = function (filename) {

  var prefix = this.fileprefix ? this.fileprefix + "_" : "";
  var pattern = new RegExp("^" + prefix + "(\\d{4}-\\d{2}-\\d{2})[A-Za-z\.]+$");
  var match = pattern.exec(filename);

  if (!match) {
    return filename;
  }

  if (this.shouldDelete(match[1])) {
    return filename;
  }
};

/**
 * Analyze a file's date to see if it should
 * be deleted.
 * @param  {string} date Date (YYYY-MM-DD)
 * @return boolean  TRUE if the file should be deleted
 */
cleanup.prototype.shouldDelete = function (date) {

  date = moment(date, "YYYY-MM-DD");

  // delete anything older than a year
  if (this.today.diff(date, "years") > 1) {
    return true;
  }

  // keep every backup that was made on the first of every month
  if (date.format("D") == 1) {
    return false;
  }

  // keep every saturday backup that is not older than a month
  if (date.format("d") == 6 && this.today.diff(date, "months") < 1) {
    return false;
  }

  // keep every daily backup that is not older than a week
  if (this.today.diff(date, "days") < 7) {
    return false;
  }

  // if nothing caught this file, delete it
  return true;
};

module.exports = cleanup;
