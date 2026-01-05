function bytesToMb(bytes) {
  if (typeof bytes !== "number" || isNaN(bytes) || bytes < 0) {
    return "0 MB";
  }

  const megabytes = bytes / (1024 * 1024);

  return `${parseFloat(megabytes.toFixed(2))} MB`;
}

module.exports = { bytesToMb };
