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

/**
 * Upload a file in multiple parts
 * @param  {object}   params   { Bucket: bucketName, Key: filenameName }
 * @param  {buffer}   buffer   Entire file butter (read file using readFileSync)
 * @param  {Function} callback
 */
s3.prototype.putMultipart = function (params, buffer, callback) {

  var self = this;

  this.s3.createMultipartUpload(params, function (error, data) {

    if (error) callback(error);

    // keep track of all parts in order to put them back together again
    self.multipartMap = { Parts: [] };

    // file size
    var bufferLength = buffer.length;

    // chunk must be at least 5MB in size (we use 10MB)
    var partSize = 1024 * 1024 * 10;

    // how many parts there will be in this upload
    var numPartsLeft = Math.ceil(bufferLength / partSize);

    console.log("Multipart upload ID", data.UploadId);

    // upload each part
    for (var rangeStart = 0, partNum = 1; rangeStart < bufferLength; rangeStart += partSize, partNum++) {

      var rangeEnd = Math.min(rangeStart + partSize, bufferLength);

      var partParams = {
        Body: buffer.slice(rangeStart, rangeEnd),
        Bucket: params.Bucket,
        Key: params.Key,
        PartNumber: partNum,
        UploadId: data.UploadId
      };

      // upload a single part
      console.log('Uploading part: #', partNum, ', Range start:', rangeStart, ', Range end:', rangeEnd);

      self.uploadPart(data, partParams, 1, function (error) {

        console.log("Completed part", partNum);

        if (--numPartsLeft > 0) return; // complete only when all parts uploaded

        var doneParams = {
          Bucket: params.Bucket,
          Key: params.Key,
          MultipartUpload: self.multipartMap,
          UploadId: data.UploadId
        };

        console.log("Completing upload...");
        self.completeMultipartUpload(doneParams, callback);

      });
    }

  });

};

s3.prototype.uploadPart = function (data, params, attempt, callback) {

  var attempt = attempt || 1;
  var maxAttempts = 3;

  var self = this;

  this.s3.uploadPart(params, function(error, data) {

    if (error) {
      console.log('multiErr, upload part error:', error);

      if (attempt < maxAttempts) {
        console.log('Retrying upload of part: #', params.PartNumber)
        self.uploadPart(data, params, attempt + 1, callback);
      } else {
        callback(error);
      }
    }

    self.multipartMap.Parts[this.request.params.PartNumber] = {
      ETag: data.ETag,
      PartNumber: Number(this.request.params.PartNumber)
    };

    callback(error, data);

  });

};

s3.prototype.completeMultipartUpload = function (doneParams, callback) {
  this.s3.completeMultipartUpload(doneParams, callback);
};

module.exports = s3;
