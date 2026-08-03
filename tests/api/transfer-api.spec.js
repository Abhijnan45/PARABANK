const { test, expect } = require('../../fixtures/apiFixtures');

test.describe('ParaBank Transfer API', () => {
  test.beforeEach(async ({ apiCustomer }) => {
    const createResponse = await apiCustomer.apiClient.createAccount(
      apiCustomer.customerId,
      1, // SAVINGS
      apiCustomer.defaultAccountNumber
    );
    const created = await createResponse.json().catch(() => null);
    apiCustomer.secondAccountNumber = created?.id;
  });

  test('transfers funds successfully between two owned accounts @smoke @api @crud', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.transfer(
      apiCustomer.defaultAccountNumber,
      apiCustomer.secondAccountNumber,
      30
    );
    expect(response.ok()).toBe(true);
  });

  test('transferred amount is reflected in the destination account balance @regression @api @e2e', async ({
    apiCustomer,
  }) => {
    const beforeResponse = await apiCustomer.apiClient.getAccount(apiCustomer.secondAccountNumber);
    const before = await beforeResponse.json();

    await apiCustomer.apiClient.transfer(apiCustomer.defaultAccountNumber, apiCustomer.secondAccountNumber, 15);

    const afterResponse = await apiCustomer.apiClient.getAccount(apiCustomer.secondAccountNumber);
    const after = await afterResponse.json();

    expect(after.balance).toBeCloseTo(before.balance + 15, 2);
  });

  test('rejects/handles a transfer from a non-existent account without a 500 @regression @api @negative', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.transfer('999999999', apiCustomer.secondAccountNumber, 10);
    expect(response.status()).not.toBe(500);
  });

  test('handles a negative transfer amount without a 500 @regression @api @boundary', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.transfer(
      apiCustomer.defaultAccountNumber,
      apiCustomer.secondAccountNumber,
      -20
    );
    expect(response.status()).not.toBe(500);
  });

  test('a completed transfer produces a matching transaction record on the source account @regression @api @e2e', async ({
    apiCustomer,
  }) => {
    await apiCustomer.apiClient.transfer(apiCustomer.defaultAccountNumber, apiCustomer.secondAccountNumber, 21);

    const txResponse = await apiCustomer.apiClient.findTransactionsByAmount(
      apiCustomer.defaultAccountNumber,
      21
    );
    expect(txResponse.ok()).toBe(true);
    const transactions = await txResponse.json();
    expect(Array.isArray(transactions) ? transactions.length : Object.keys(transactions).length).toBeGreaterThan(
      0
    );
  });
});
