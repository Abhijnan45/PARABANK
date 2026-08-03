const base = require('@playwright/test');
const { ApiClient } = require('../utilities/apiClient');
const envConfig = require('../config/env.config');
const { uniqueUsername, randomSSN, randomPhoneNumber, randomZipCode, generateUuid } = require('../utilities/dataGenerator');
const { logCreatedAccount } = require('../utilities/csvLogger');
const testData = require('../test-data/customers.json');
const { RegistrationPage } = require('../pages/RegistrationPage');
const { AccountsOverviewPage } = require('../pages/AccountsOverviewPage');

/**
 * apiFixtures
 *
 * ParaBank has no public "create customer" REST endpoint — registration
 * only exists as a UI form (register.htm posts back a redirect, it's
 * not a documented JSON API). So API tests still register through the
 * UI once, then switch to pure API calls for everything else. This is
 * the honest hybrid boundary: UI creates the fixture data, API tests
 * the actual service layer.
 *
 * `apiCustomer` provides: { apiClient, customerId, username, password,
 * defaultAccountNumber }.
 */
const test = base.test.extend({
  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: envConfig.apiBaseURL });
    await use(context);
    await context.dispose();
  },

  apiCustomer: async ({ page, apiContext }, use, testInfo) => {
    const customer = {
      ...testData.validCustomerTemplate,
      ssn: randomSSN(),
      phoneNumber: randomPhoneNumber(),
      zipCode: randomZipCode(),
      username: uniqueUsername('qaapi'),
      password: 'Str0ngP@ssw0rd',
      confirmPassword: 'Str0ngP@ssw0rd',
    };

    const registrationPage = new RegistrationPage(page);
    const accountsOverviewPage = new AccountsOverviewPage(page);

    await registrationPage.open();
    await registrationPage.register(customer);
    await accountsOverviewPage.open();
    const accountNumbers = await accountsOverviewPage.getAccountNumbers();

    const apiClient = new ApiClient(apiContext);
    const loginResponse = await apiClient.login(customer.username, customer.password);
    const customerJson = await loginResponse.json().catch(() => null);

    logCreatedAccount({
      runId: generateUuid(),
      testTitle: testInfo.title,
      username: customer.username,
      defaultAccountNumber: accountNumbers[0],
    });

    await use({
      apiClient,
      customerId: customerJson?.id,
      username: customer.username,
      password: customer.password,
      defaultAccountNumber: accountNumbers[0],
    });
  },
});

const expect = base.expect;

module.exports = { test, expect };
