if (!process.permission) {
  process._rawDebug("LavaMoat - No permissions found on global, terminating");
  process.exit(1);
}
