const base = require('./pageFixtures');
const { uniqueUsername, randomSSN, randomPhoneNumber, randomZipCode, generateUuid } = require('../utilities/dataGenerator');
const { logCreatedAccount } = require('../utilities/csvLogger');
const testData = require('../test-data/customers.json');

/**
 * authFixtures
 *
 * Most of Phase 2 (accounts, transfer, bill pay, transactions) requires
 * an authenticated session. Rather than hardcode a shared demo account
 * — which would collide across parallel workers and across anyone else
 * testing against this same public instance — every test that needs
 * to be logged in registers its OWN fresh customer first.
 *
 * This costs a couple of extra seconds per test but buys real
 * independence: tests can run in parallel, in any order, repeatedly,
 * without stepping on each other's account balances or transaction
 * history. That reliability matters more for a portfolio piece than
 * shaving a few seconds off suite runtime.
 */
const test = base.test.extend({
  newCustomer: async ({ page, registrationPage, accountsOverviewPage }, use, testInfo) => {
    const customer = {
      ...testData.validCustomerTemplate,
      ssn: randomSSN(),
      phoneNumber: randomPhoneNumber(),
      zipCode: randomZipCode(),
      username: uniqueUsername('qabank'),
      password: 'Str0ngP@ssw0rd',
      confirmPassword: 'Str0ngP@ssw0rd',
    };

    await registrationPage.open();
    await registrationPage.register(customer);
    // Registration on ParaBank auto-logs-in the new customer, landing
    // on overview.htm with exactly one (default) account created.
    await accountsOverviewPage.open();
    const accountNumbers = await accountsOverviewPage.getAccountNumbers();

    logCreatedAccount({
      runId: generateUuid(),
      testTitle: testInfo.title,
      username: customer.username,
      defaultAccountNumber: accountNumbers[0],
    });

    await use({
      ...customer,
      defaultAccountNumber: accountNumbers[0],
    });
  },
});

const expect = base.expect;

module.exports = { test, expect };
