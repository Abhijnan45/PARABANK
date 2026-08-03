const { test, expect } = require('../../fixtures/apiFixtures');
const { AccountsOverviewPage } = require('../../pages/AccountsOverviewPage');

/**
 * Hybrid suite — the point of these tests is deliberately to cross
 * layers: act through one (UI or API) and verify through the other.
 * This is what actually demonstrates understanding beyond "click
 * things" or "call endpoints" in isolation.
 */
test.describe('ParaBank UI + API Hybrid', () => {
  test('an account opened via the API appears immediately in the UI overview page @e2e @api @regression', async ({
    apiCustomer,
    page,
  }) => {
    const createResponse = await apiCustomer.apiClient.createAccount(
      apiCustomer.customerId,
      1, // SAVINGS
      apiCustomer.defaultAccountNumber
    );
    expect(createResponse.ok()).toBe(true);
    const created = await createResponse.json();

    const accountsOverviewPage = new AccountsOverviewPage(page);
    await accountsOverviewPage.open();
    const accountNumbers = await accountsOverviewPage.getAccountNumbers();
    expect(accountNumbers).toContain(String(created.id));
  });

  test('a transfer made via the API is reflected in the UI account balance @e2e @api @regression', async ({
    apiCustomer,
    page,
  }) => {
    const createResponse = await apiCustomer.apiClient.createAccount(
      apiCustomer.customerId,
      1,
      apiCustomer.defaultAccountNumber
    );
    const created = await createResponse.json();

    const beforeResponse = await apiCustomer.apiClient.getAccount(created.id);
    const before = await beforeResponse.json();

    await apiCustomer.apiClient.transfer(apiCustomer.defaultAccountNumber, created.id, 18);

    const accountsOverviewPage = new AccountsOverviewPage(page);
    await accountsOverviewPage.open();
    await accountsOverviewPage.page.reload();

    const rows = await accountsOverviewPage.accountRows.all();
    let matchedRowBalanceText = null;
    for (const row of rows) {
      const text = await row.textContent();
      if (text?.includes(String(created.id))) {
        matchedRowBalanceText = text;
        break;
      }
    }
    expect(matchedRowBalanceText).toBeTruthy();
    // Balance should now reflect the +18 transfer somewhere in that row's text.
    expect(matchedRowBalanceText).toMatch(new RegExp(`${(before.balance + 18).toFixed(2)}`));
  });

  test('a customer registered via the UI can be authenticated purely via the API afterward @e2e @api @smoke', async ({
    apiCustomer,
  }) => {
    // apiCustomer fixture already does UI-register -> API-login; this
    // test asserts that boundary explicitly rather than implicitly.
    expect(apiCustomer.customerId).toBeTruthy();
    const accountsResponse = await apiCustomer.apiClient.getAccountsForCustomer(apiCustomer.customerId);
    expect(accountsResponse.ok()).toBe(true);
  });

  test('a bill paid via the UI is retrievable as a transaction via the API @e2e @regression', async ({
    apiCustomer,
    page,
  }) => {
    const { BillPayPage } = require('../../pages/BillPayPage');
    const billPayPage = new BillPayPage(page);
    await billPayPage.open();
    await billPayPage.payBill(
      {
        name: 'Adani Gas Ltd',
        street: '9 SG Highway',
        city: 'Ahmedabad',
        state: 'Gujarat',
        zipCode: '380054',
        phoneNumber: '079-4099-8811',
        accountNumber: '10001',
        verifyAccountNumber: '10001',
        amount: '33.00',
      },
      apiCustomer.defaultAccountNumber
    );
    expect(await billPayPage.isPaymentComplete()).toBe(true);

    const txResponse = await apiCustomer.apiClient.findTransactionsByAmount(
      apiCustomer.defaultAccountNumber,
      33
    );
    expect(txResponse.ok()).toBe(true);
    const transactions = await txResponse.json();
    const count = Array.isArray(transactions) ? transactions.length : 0;
    expect(count).toBeGreaterThan(0);
  });
});
