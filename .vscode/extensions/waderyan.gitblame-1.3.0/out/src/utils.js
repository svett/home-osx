/**
 * Converts a unix timestamp to a JS object.
 */
function toDate(unixTimestamp) {
    // Multiply by 1000 to convert to seconds. 
    return new Date(unixTimestamp * 1000);
}
exports.toDate = toDate;
/**
 * Returns the number of months between two dates.
 */
function dateDifference(dateNow, dateThen) {
    return dateNow.getTime() - dateThen.getTime();
}
exports.dateDifference = dateDifference;
//# sourceMappingURL=utils.js.map