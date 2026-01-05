function dateToString(dateString) {
  console.log("date: ", dateString, typeof dateString);

  const date = new Date(dateString);

  return date.toUTCString();
}

module.exports = { dateToString };
