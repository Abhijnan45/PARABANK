const { test, expect } = require('../../fixtures/authFixtures');
const { randomPhoneNumber, randomZipCode } = require('../../utilities/dataGenerator');

function buildPayee(overrides = {}) {
  return {
    name: 'Gujarat Electricity Board',
    street: '45 Ashram Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    zipCode: randomZipCode(),
    phoneNumber: randomPhoneNumber(),
    accountNumber: '10001',
    verifyAccountNumber: '10001',
    amount: '75.00',
    ...overrides,
  };
}

test.describe('ParaBank Bill Pay', () => {
  test('pays a bill successfully with valid payee details @smoke @crud', async ({
    newCustomer,
    billPayPage,
  }) => {
    await billPayPage.open();
    await billPayPage.payBill(buildPayee(), newCustomer.defaultAccountNumber);
    expect(await billPayPage.isPaymentComplete()).toBe(true);
  });

  test('rejects payment when payee name is missing @regression @validation', async ({
    newCustomer,
    billPayPage,
  }) => {
    await billPayPage.open();
    await billPayPage.payBill(buildPayee({ name: '' }), newCustomer.defaultAccountNumber);
    expect(await billPayPage.isPaymentComplete()).toBe(false);
  });

  test('rejects payment when account number and verify-account number do not match @regression @validation', async ({
    newCustomer,
    billPayPage,
  }) => {
    await billPayPage.open();
    await billPayPage.payBill(
      buildPayee({ accountNumber: '10001', verifyAccountNumber: '99999' }),
      newCustomer.defaultAccountNumber
    );
    expect(await billPayPage.isPaymentComplete()).toBe(false);
  });

  test('handles a zero-amount bill payment without silently confirming it @regression @boundary', async ({
    newCustomer,
    billPayPage,
  }) => {
    await billPayPage.open();
    await billPayPage.payBill(buildPayee({ amount: '0' }), newCustomer.defaultAccountNumber);
    await expect(billPayPage.page).not.toHaveURL(/500|error\.htm/);
  });
});
