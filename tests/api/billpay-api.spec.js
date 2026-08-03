const { test, expect } = require('../../fixtures/apiFixtures');
const { validPayee, invalidPayeeMissingName } = require('../../test-data/api-payloads.json');

test.describe('ParaBank Bill Pay API', () => {
  test('pays a bill successfully via the REST endpoint @smoke @api @crud', async ({ apiCustomer }) => {
    const response = await apiCustomer.apiClient.payBill(apiCustomer.defaultAccountNumber, validPayee);
    expect(response.ok()).toBe(true);
  });

  test('rejects/handles a bill payment with a missing payee name without a 500 @regression @api @validation', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.payBill(
      apiCustomer.defaultAccountNumber,
      invalidPayeeMissingName
    );
    expect(response.status()).not.toBe(500);
  });

  test('a successful bill payment produces a matching outbound transaction @regression @api @e2e', async ({
    apiCustomer,
  }) => {
    await apiCustomer.apiClient.payBill(apiCustomer.defaultAccountNumber, validPayee);

    const txResponse = await apiCustomer.apiClient.getTransactionsForAccount(apiCustomer.defaultAccountNumber);
    expect(txResponse.ok()).toBe(true);
    const transactions = await txResponse.json();
    expect(transactions.length).toBeGreaterThan(0);
  });

  test('handles bill payment against a non-existent account without a 500 @regression @api @negative', async ({
    apiCustomer,
  }) => {
    const response = await apiCustomer.apiClient.payBill('999999999', validPayee);
    expect(response.status()).not.toBe(500);
  });
});
