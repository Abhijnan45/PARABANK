/**
 * dataGenerator
 *
 * ParaBank is a shared public instance — every test run competes with
 * everyone else currently testing against it. Registration tests in
 * particular need unique usernames every run or they'll fail on a
 * false-negative "username already exists" rather than the thing
 * we're actually testing. This utility keeps that uniqueness in one
 * place instead of ad-hoc Date.now() calls scattered through specs.
 */

function randomDigits(length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

function uniqueUsername(prefix = 'qauser') {
  return `${prefix}_${Date.now()}_${randomDigits(3)}`;
}

function randomSSN() {
  return `${randomDigits(3)}-${randomDigits(2)}-${randomDigits(4)}`;
}

function randomPhoneNumber() {
  return `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`;
}

function randomZipCode() {
  return randomDigits(5);
}

/**
 * A minimal RFC-4122-ish v4 UUID (no external package needed). Used to
 * tag each test's created-account record in the CSV audit log (see
 * csvLogger.js) so records from parallel workers never collide, even
 * though this app runs its own crypto internally rather than pulling
 * in the `uuid` package for something this small.
 */
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = {
  uniqueUsername,
  randomSSN,
  randomPhoneNumber,
  randomZipCode,
  randomDigits,
  generateUuid,
};
