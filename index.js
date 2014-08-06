module.exports = {
  cleanup: require("./lib/cleanup"),
  backup: {
    files: require("./lib/files/backup"),
    db: require("./lib/db/backup")
  }
};
