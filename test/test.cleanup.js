var expect = require("chai").expect;
var sinon = require("sinon");
var moment = require("moment");
var cleanup = require("../lib/cleanup");

describe("cleanup", function () {

  describe(".getObjects()", function () {

    // can this be mocked?
    cleanup.s3 = {
      listObjects: function () {}
    };

    sinon
      .stub(cleanup.s3, "listObjects")
      .yields(null, { Contents: "objects" });


    it("should extract the objects from the response", function (done) {

      cleanup.getObjects("bucket", function (error, objects) {
        expect(objects).to.equal("objects");
        done();
      
      });

    });

  });

  describe(".findObjectsToDelete()", function () {

    it("should return empty if no files need to be deleted", function () {

      cleanup.dbprefix = "jhu_staging";
      cleanup.today = moment("2014-03-12", "YYYY-MM-DD");
      
      var objects = [
        { Key: "jhu_staging_2014-01-01.sql.gz" },   // monthly backup, keep
        { Key: "jhu_staging_2014-03-08.sql.gz" },   // saturday backup, keep
        { Key: "jhu_staging_2014-03-01.sql.gz" },   // monthly backup, keep
        { Key: "jhu_staging_2014-03-09.sql.gz" },   // daily backup, keep
      ];

      expect(cleanup.findObjectsToDelete(objects)).to.be.empty;
    
    });

    it("should return files that do not match the expected pattern", function () {
      
      var objects = [
        { Key: "somefile.html" }
      ];

      expect(cleanup.findObjectsToDelete(objects)).to.deep.equal(objects);
    
    });

    it("should return files that need to be deleted", function () {

      cleanup.dbprefix = "jhu_staging";
      
      var objects = [
        { Key: "jhu_staging.sql.gz" },              // does not match regex, delete
        { Key: "jhu_staging_2014-03-02.sql.gz" },   // daily backup older than a week, delete
        { Key: "jhu_staging_2012-01-01.sql.gz" },   // older than a year, delete
        { Key: "jhu_staging_2014-01-02.sql.gz" },   // not a monthly backup, delete
      ];

      expect(cleanup.findObjectsToDelete(objects)).to.deep.equal(objects);
    
    });

    it("should return files that need to be deleted even when no prefix is used", function () {
      
      var objects = [
        { Key: "2014-03-02.sql.gz" },   // daily backup older than a week, delete
        { Key: "2012-01-01.sql.gz" },   // older than a year, delete
        { Key: "2014-01-02.sql.gz" },   // not a monthly backup, delete
      ];

      expect(cleanup.findObjectsToDelete(objects)).to.deep.equal(objects);
    
    });


  });

});