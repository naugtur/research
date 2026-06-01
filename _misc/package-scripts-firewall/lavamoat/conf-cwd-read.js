exports.options = {
  "--permission": true,
  "--allow-fs-read": ["./"],
  "--allow-child-process": false,
  "--allow-worker": false,
  "--allow-net": false,
  "--allow-addons": false,
  "--allow-ffi": false,
};

exports.envBanKeywords = [
  "SESSION",
  "SSH",
  "GPG",
  "KEY",
  "AGENT",
  "TOKEN",
  "SECRET",
  "PASSWORD",
  "PASS",
  "AUTH",
  "CREDENTIALS",
];
