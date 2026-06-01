exports.options = {
  // "--require": ["./lavamoat/lockdown.js"],
  "--require": ["@lavamoat/node-guard/lockdown.js"],
  "--permission": true,
  "--allow-fs-read": ["./"],
};
