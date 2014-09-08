module.exports = {
  cleanup: require("./lib/cleanup"),
  backup: {
    files: require("./lib/filesbackup"),
    db: require("./lib/dbbackup")
  }
};
