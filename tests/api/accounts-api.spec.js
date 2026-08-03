const { test, expect } = require('../../fixtures/apiFixtures');

test.describe('ParaBank Accounts API', () => {
  test('login endpoint returns a customer id for valid credentials @smoke @api', async ({
    apiCustomer,
  }) => {
    expect(apiCustomer.customerId).toBeTruthy();
    expect(typeof apiCustomer.customerId === 'number' || typeof apiCustomer.customerId === 'string').toBe(
      true
    );
  });

  test('login endpoint does not return a valid customer for a wrong password @regression @api @negative', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.login(apiCustomer.username, 'DefinitelyWrongPass1');
    // ParaBank's REST login either 4xx's or returns a body without a
    // usable customer id on failure — assert on the meaningful outcome
    // (no valid id) rather than a specific status code we haven't
    // independently confirmed across all deployments.
    if (response.ok()) {
      const body = await response.json().catch(() => null);
      expect(body?.id).toBeFalsy();
    } else {
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('GET accounts for customer includes the default account created at registration @smoke @api @crud', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.getAccountsForCustomer(apiCustomer.customerId);
    expect(response.ok()).toBe(true);
    const accounts = await response.json();
    expect(Array.isArray(accounts)).toBe(true);
    const accountIds = accounts.map((a) => String(a.id));
    expect(accountIds).toContain(String(apiCustomer.defaultAccountNumber));
  });

  test('GET account details returns the correct account id @regression @api', async ({ apiCustomer }) => {
    const response = await apiCustomer.apiClient.getAccount(apiCustomer.defaultAccountNumber);
    expect(response.ok()).toBe(true);
    const account = await response.json();
    expect(String(account.id)).toBe(String(apiCustomer.defaultAccountNumber));
  });

  test('GET account details for a non-existent account id fails gracefully @regression @api @negative', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.getAccount('999999999');
    // Should not succeed with a fabricated account — and must not 500.
    expect(response.status()).not.toBe(500);
    if (response.ok()) {
      const account = await response.json().catch(() => null);
      expect(account?.id).not.toBe(999999999);
    }
  });
});
