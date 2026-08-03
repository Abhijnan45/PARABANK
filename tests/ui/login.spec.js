const { test, expect } = require('../../fixtures/pageFixtures');
const testData = require('../../test-data/customers.json');
const { boundaryData, invalidLoginAttempts } = testData;

/**
 * Login suite — ParaBank Customer Login (index.htm)
 *
 * Note on scope: ParaBank has no fixed "known good" demo credentials
 * that reliably persist (the public instance's seed data has changed
 * over time in past framework runs against it). Rather than hardcode
 * a username/password that may silently break the whole suite when
 * the instance resets, the "valid login" path is proven via the
 * registration suite (register -> login with the account just
 * created). This suite focuses on what's stable to test against a
 * shared public instance: form validation, negative paths, and
 * boundary/security input handling.
 */
test.describe('ParaBank Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('login form renders with username, password and submit @smoke', async ({ loginPage }) => {
    expect(await loginPage.isLoginFormVisible()).toBe(true);
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('displays Register and Forgot Login links @smoke', async ({ loginPage }) => {
    await expect(loginPage.registerLink).toBeVisible();
    await expect(loginPage.forgotLoginLink).toBeVisible();
  });

  for (const attempt of invalidLoginAttempts) {
    test(`rejects login for ${attempt.case} @regression`, async ({ loginPage, page }) => {
      await loginPage.login(attempt.username, attempt.password);
      // ParaBank re-renders the login page with an error panel on
      // failure rather than navigating away — URL should stay put.
      await expect(page).toHaveURL(/index\.htm|login\.htm/);
      expect(await loginPage.isLoginFormVisible()).toBe(true);
    });
  }

  test('handles SQL-injection-style input without granting access @regression @security', async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(boundaryData.sqlInjectionAttempt, boundaryData.sqlInjectionAttempt);
    await expect(page).toHaveURL(/index\.htm|login\.htm/);
    expect(await loginPage.isLoginFormVisible()).toBe(true);
  });

  test('handles script-injection-style input without executing it @regression @security', async ({
    loginPage,
    page,
  }) => {
    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });
    await loginPage.login(boundaryData.scriptInjectionAttempt, 'anyPassword123');
    expect(dialogFired).toBe(false);
  });

  test('rejects whitespace-only username @regression @boundary', async ({ loginPage, page }) => {
    await loginPage.login(boundaryData.whitespaceOnly, 'somePassword');
    await expect(page).toHaveURL(/index\.htm|login\.htm/);
  });

  test('rejects a single-character username as invalid credentials @regression @boundary', async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(boundaryData.singleCharUsername, 'x');
    await expect(page).toHaveURL(/index\.htm|login\.htm/);
  });

  test('username field trims/handles leading and trailing spaces consistently @regression', async ({
    loginPage,
  }) => {
    await loginPage.login('  spacedUsername  ', 'somePassword');
    // We assert on behavior, not a hardcoded expected outcome, since
    // this account doesn't exist — the meaningful check is that the
    // app doesn't error/crash on the padded input.
    expect(await loginPage.isLoginFormVisible()).toBe(true);
  });

  test('navigates to the registration page via Register link @smoke', async ({ loginPage, page }) => {
    await loginPage.goToRegister();
    await expect(page).toHaveURL(/register\.htm/);
  });

  test('navigates to the forgot-login page via Forgot Login link @regression', async ({
    loginPage,
    page,
  }) => {
    await loginPage.goToForgotLogin();
    await expect(page).toHaveURL(/lookup\.htm/);
  });

  test('repeated failed logins do not crash the session (rate/lockout resilience) @regression', async ({
    loginPage,
    page,
  }) => {
    for (let i = 0; i < 3; i++) {
      await loginPage.login('nonexistentuser12345', `wrongpass${i}`);
      await loginPage.open();
    }
    expect(await loginPage.isLoginFormVisible()).toBe(true);
  });
});
