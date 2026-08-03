const fs = require('fs');
const path = require('path');

/**
 * csvLogger
 *
 * Genuine reason this exists (not a box-ticking utility): ParaBank is
 * a shared public instance with no test-data cleanup endpoint. Every
 * customer/account this framework creates persists there indefinitely.
 * Logging what was created — username, account number, timestamp,
 * which test created it — gives a real audit trail, which matters
 * both for debugging ("did my run actually register a customer?")
 * and for being a considerate user of someone else's shared demo
 * environment.
 */
const LOG_PATH = path.join(process.cwd(), 'reports', 'created-accounts.csv');
const HEADER = 'runId,testTitle,username,defaultAccountNumber,createdAt\n';

function ensureLogFile() {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(LOG_PATH, HEADER, 'utf8');
  }
}

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function logCreatedAccount({ runId, testTitle, username, defaultAccountNumber }) {
  try {
    ensureLogFile();
    const row = [runId, testTitle, username, defaultAccountNumber, new Date().toISOString()]
      .map(escapeCsvField)
      .join(',');
    fs.appendFileSync(LOG_PATH, `${row}\n`, 'utf8');
  } catch (err) {
    // Never let audit logging fail an actual test — this is a
    // best-effort side record, not part of the pass/fail contract.
    // eslint-disable-next-line no-console
    console.warn(`csvLogger: failed to write audit row — ${err.message}`);
  }
}

module.exports = { logCreatedAccount, LOG_PATH };
