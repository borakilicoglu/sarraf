const { Command } = require("commander");
const chalkPath = require.resolve("chalk");

module.exports = {
  program: new Command(),
  chalkPath,
};
