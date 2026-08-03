const { test, expect } = require('../../fixtures/apiFixtures');

test.describe('ParaBank Transactions API', () => {
  test('GET transactions for the default account returns an array @smoke @api', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.getTransactionsForAccount(apiCustomer.defaultAccountNumber);
    expect(response.ok()).toBe(true);
    const transactions = await response.json();
    expect(Array.isArray(transactions)).toBe(true);
  });

  test('finding a transaction by its exact id returns matching data @regression @api', async ({
    apiCustomer,
  }) => {
    const listResponse = await apiCustomer.apiClient.getTransactionsForAccount(
      apiCustomer.defaultAccountNumber
    );
    const transactions = await listResponse.json();
    test.skip(!transactions.length, 'No transactions exist yet on a brand-new account to look up by id');

    const targetId = transactions[0].id;
    const response = await apiCustomer.apiClient.findTransactionById(targetId);
    expect(response.ok()).toBe(true);
    const transaction = await response.json();
    expect(String(transaction.id)).toBe(String(targetId));
  });

  test('finding a transaction by a non-existent id fails gracefully @regression @api @negative', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.findTransactionById('999999999');
    expect(response.status()).not.toBe(500);
  });

  test('finding transactions by an amount that has never occurred returns an empty result @regression @api @negative', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.findTransactionsByAmount(
      apiCustomer.defaultAccountNumber,
      123456.78
    );
    expect(response.status()).not.toBe(500);
    if (response.ok()) {
      const transactions = await response.json();
      const count = Array.isArray(transactions) ? transactions.length : 0;
      expect(count).toBe(0);
    }
  });
});
