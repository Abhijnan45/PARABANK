const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RegistrationPage } = require('../pages/RegistrationPage');
const { AccountsOverviewPage } = require('../pages/AccountsOverviewPage');
const { OpenAccountPage } = require('../pages/OpenAccountPage');
const { TransferFundsPage } = require('../pages/TransferFundsPage');
const { BillPayPage } = require('../pages/BillPayPage');
const { FindTransactionsPage } = require('../pages/FindTransactionsPage');

/**
 * Extends Playwright's base `test` with page objects pre-instantiated,
 * so specs consume `{ loginPage, registrationPage }` directly instead
 * of constructing `new LoginPage(page)` in every single test.
 */
const test = base.test.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
  accountsOverviewPage: async ({ page }, use) => {
    await use(new AccountsOverviewPage(page));
  },
  openAccountPage: async ({ page }, use) => {
    await use(new OpenAccountPage(page));
  },
  transferFundsPage: async ({ page }, use) => {
    await use(new TransferFundsPage(page));
  },
  billPayPage: async ({ page }, use) => {
    await use(new BillPayPage(page));
  },
  findTransactionsPage: async ({ page }, use) => {
    await use(new FindTransactionsPage(page));
  },
});

const expect = base.expect;

module.exports = { test, expect };
