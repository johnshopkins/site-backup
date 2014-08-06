module.exports = {
  db: {
    backup: require("./lib/db/backup"),
    cleanup: require("./lib/db/cleanup")
  },
  files: {
    backup: require("./lib/files/backup"),
    cleanup: require("./lib/files/cleanup")
  }
};
