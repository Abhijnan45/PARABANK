const { test, expect } = require('../../fixtures/authFixtures');
const { LoginPage } = require('../../pages/LoginPage');

/**
 * Advanced-feature tests — added selectively, only where ParaBank's
 * real behavior gives them something genuine to verify:
 *
 * - Network/API mocking: legitimate here because it lets us test the
 *   UI's reaction to a backend failure ParaBank's real backend won't
 *   reliably produce on demand (a 500 from the login endpoint).
 * - Cookies/session: ParaBank is a classic server-rendered JSP app —
 *   session state lives in a JSESSIONID cookie, not localStorage or
 *   sessionStorage. So that's what's tested here; there's nothing to
 *   genuinely test in web storage because the app doesn't use it.
 * - Multi-window and iframe handling are deliberately NOT included:
 *   no ParaBank flow in this framework's scope opens a second window
 *   or embeds a frame, so a "test" for either would just be decoration
 *   with nothing real behind it.
 */
test.describe('ParaBank Advanced — Network Mocking', () => {
  test('UI handles a mocked 500 from the login form submit without crashing @regression @mocking', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();

    // Intercept the login form's POST and force a server-error response,
    // simulating a backend outage we can't reliably trigger for real.
    await page.route('**/login.htm', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'text/html',
          body: '<html><body>Internal Server Error</body></html>',
        });
      }
      return route.continue();
    });

    await loginPage.login('anyuser', 'anypassword');
    // The meaningful assertion: the app/browser didn't hang or throw —
    // the page still rendered something.
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('UI does not silently treat a mocked malformed response as a successful login @regression @mocking', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();

    await page.route('**/login.htm', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 200, contentType: 'text/html', body: '' });
      }
      return route.continue();
    });

    await loginPage.login('anyuser', 'anypassword');
    // An empty 200 body should not be mistaken for the real overview page.
    await expect(page).not.toHaveURL(/overview\.htm/);
  });
});

test.describe('ParaBank Advanced — Cookies & Session', () => {
  test('a JSESSIONID cookie is set after a successful registration/login @regression @session', async ({
    newCustomer,
    page,
  }) => {
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.toUpperCase().includes('JSESSIONID'));
    expect(sessionCookie).toBeTruthy();
  });

  test('logging out invalidates the session — a protected page redirects back to login @regression @session', async ({
    newCustomer,
    page,
  }) => {
    await page.goto('logout.htm');
    await page.goto('overview.htm');
    // ParaBank redirects unauthenticated access to overview.htm back
    // to the login page rather than showing account data.
    const loginPage = new LoginPage(page);
    expect(await loginPage.isLoginFormVisible()).toBe(true);
  });

  test('ParaBank does not rely on localStorage or sessionStorage for session state @regression @session', async ({
    newCustomer,
    page,
  }) => {
    const storageSnapshot = await page.evaluate(() => ({
      localStorageLength: window.localStorage.length,
      sessionStorageLength: window.sessionStorage.length,
    }));
    // Documenting actual architecture rather than assuming it: this
    // classic server-rendered app keeps session state server-side via
    // the JSESSIONID cookie, so both web storage areas stay empty.
    expect(storageSnapshot.localStorageLength).toBe(0);
    expect(storageSnapshot.sessionStorageLength).toBe(0);
  });
});
