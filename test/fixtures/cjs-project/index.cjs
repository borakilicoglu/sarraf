const fs = require("fs");
const path = require("node:path");
const { Command } = require("commander");
const chalkPath = require.resolve("chalk");

module.exports = {
  fsExists: typeof fs.existsSync === "function",
  basename: path.basename(chalkPath),
  program: new Command(),
  chalkPath,
};
