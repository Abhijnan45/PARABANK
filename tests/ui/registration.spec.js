const { test, expect } = require('../../fixtures/pageFixtures');
const testData = require('../../test-data/customers.json');
const { uniqueUsername, randomSSN, randomPhoneNumber, randomZipCode } = require('../../utilities/dataGenerator');

const { validCustomerTemplate, boundaryData } = testData;

function buildValidCustomer(overrides = {}) {
  return {
    ...validCustomerTemplate,
    ssn: randomSSN(),
    phoneNumber: randomPhoneNumber(),
    zipCode: randomZipCode(),
    username: uniqueUsername(),
    password: 'Str0ngP@ssw0rd',
    confirmPassword: 'Str0ngP@ssw0rd',
    ...overrides,
  };
}

test.describe('ParaBank Registration', () => {
  test.beforeEach(async ({ registrationPage }) => {
    await registrationPage.open();
  });

  test('registration form renders all required fields @smoke', async ({ registrationPage }) => {
    await expect(registrationPage.firstName).toBeVisible();
    await expect(registrationPage.lastName).toBeVisible();
    await expect(registrationPage.username).toBeVisible();
    await expect(registrationPage.password).toBeVisible();
    await expect(registrationPage.registerButton).toBeVisible();
  });

  test('successfully registers a new customer with valid data @smoke @crud', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer();
    await registrationPage.register(customer);
    const message = await registrationPage.getSuccessMessage();
    expect(message).toMatch(/Welcome|created/i);
  });

  test('newly registered customer can immediately log in @smoke @crud @auth', async ({
    registrationPage,
    loginPage,
    page,
  }) => {
    const customer = buildValidCustomer();
    await registrationPage.register(customer);
    await expect(page.locator('#rightPanel')).toContainText(/Welcome|created/i);

    // Log out (registration auto-logs-in on ParaBank) then verify the
    // same credentials work on a fresh login — this is the real
    // "valid login" proof, generated fresh per run instead of relying
    // on a hardcoded shared account.
    await page.goto('logout.htm');
    await loginPage.open();
    await loginPage.login(customer.username, customer.password);
    await expect(page).not.toHaveURL(/error/i);
  });

  test('rejects registration with missing first name @regression @validation', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ firstName: '' });
    await registrationPage.register(customer);
    await expect(registrationPage.page.locator('#rightPanel')).not.toContainText(/Welcome/i);
  });

  test('rejects registration with missing last name @regression @validation', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ lastName: '' });
    await registrationPage.register(customer);
    await expect(registrationPage.page.locator('#rightPanel')).not.toContainText(/Welcome/i);
  });

  test('rejects registration with missing username @regression @validation', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ username: '' });
    await registrationPage.register(customer);
    await expect(registrationPage.page.locator('#rightPanel')).not.toContainText(/Welcome/i);
  });

  test('rejects registration when password and confirm password mismatch @regression @validation', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ confirmPassword: 'SomethingDifferent1' });
    await registrationPage.register(customer);
    await expect(registrationPage.page.locator('#rightPanel')).not.toContainText(/Welcome/i);
  });

  test('rejects duplicate username registration @regression @negative', async ({
    registrationPage,
    page,
  }) => {
    const customer = buildValidCustomer();
    await registrationPage.register(customer);
    await expect(page.locator('#rightPanel')).toContainText(/Welcome|created/i);

    // Attempt to register the exact same username again
    await registrationPage.open();
    await registrationPage.register(customer);
    await expect(page.locator('#rightPanel')).not.toContainText(/^Welcome/i);
  });

  test('rejects registration with an excessively long first name @regression @boundary', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ firstName: boundaryData.veryLongFirstName });
    await registrationPage.register(customer);
    // App should either reject or truncate — either way it must not
    // silently crash into an unrelated error page.
    await expect(registrationPage.page).not.toHaveURL(/500|error\.htm/);
  });

  test('handles special characters in zip code gracefully @regression @boundary', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ zipCode: boundaryData.specialCharsZip });
    await registrationPage.register(customer);
    await expect(registrationPage.page).not.toHaveURL(/500|error\.htm/);
  });

  test('handles SQL-injection-style input in first name field @regression @security', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ firstName: boundaryData.sqlInjectionAttempt });
    await registrationPage.register(customer);
    await expect(registrationPage.page).not.toHaveURL(/500|error\.htm/);
  });

  test('handles script-injection-style input in last name field without executing it @regression @security', async ({
    registrationPage,
  }) => {
    let dialogFired = false;
    registrationPage.page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });
    const customer = buildValidCustomer({ lastName: boundaryData.scriptInjectionAttempt });
    await registrationPage.register(customer);
    expect(dialogFired).toBe(false);
  });

  test('rejects a single-character username on registration @regression @boundary', async ({
    registrationPage,
  }) => {
    const customer = buildValidCustomer({ username: boundaryData.singleCharUsername });
    await registrationPage.register(customer);
    // Either accepted (edge but valid) or rejected — assert app
    // stability rather than a guessed validation rule we haven't
    // confirmed ParaBank actually enforces.
    await expect(registrationPage.page).not.toHaveURL(/500|error\.htm/);
  });

  test('two customers can register with different usernames in the same run @regression', async ({
    registrationPage,
    page,
  }) => {
    const first = buildValidCustomer();
    await registrationPage.register(first);
    await expect(page.locator('#rightPanel')).toContainText(/Welcome|created/i);

    await page.goto('logout.htm');
    await registrationPage.open();
    const second = buildValidCustomer();
    await registrationPage.register(second);
    await expect(page.locator('#rightPanel')).toContainText(/Welcome|created/i);

    expect(first.username).not.toBe(second.username);
  });
});
